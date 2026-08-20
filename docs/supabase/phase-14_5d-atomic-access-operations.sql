-- B.R Fase 14.5D - operaciones atomicas criticas de acceso y pago manual.
-- Incremental: no borra historial ni reemplaza el trigger Realtime de beat_access.

create or replace function public.grant_beat_access_atomic(
  p_user_id uuid,
  p_beat_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_access_id uuid;
  v_access_created boolean := false;
  v_request_count integer := 0;
begin
  if auth.uid() is null or not private.is_br_admin() then
    raise exception using errcode = '42501', message = 'Esta accion requiere permisos de administrador.';
  end if;

  if p_user_id is null or p_beat_id is null then
    raise exception using errcode = '22023', message = 'Usuario y beat son obligatorios.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_beat_id::text, 0)
  );

  insert into public.beat_access (user_id, beat_id, granted_by)
  values (p_user_id, p_beat_id, auth.uid())
  on conflict (user_id, beat_id) do nothing
  returning id into v_access_id;

  v_access_created := v_access_id is not null;

  update public.access_requests
  set
    status = 'fulfilled',
    responded_at = now(),
    updated_at = now()
  where user_id = p_user_id
    and beat_id = p_beat_id
    and status in ('pending', 'contacted', 'payment_pending', 'paid', 'approved');

  get diagnostics v_request_count = row_count;

  return jsonb_build_object(
    'access_created', v_access_created,
    'request_updated', v_request_count > 0
  );
end;
$$;

create or replace function public.revoke_beat_access_atomic(
  p_user_id uuid,
  p_beat_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_access_id uuid;
  v_revocation_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if auth.uid() is null or not private.is_br_admin() then
    raise exception using errcode = '42501', message = 'Esta accion requiere permisos de administrador.';
  end if;

  if p_user_id is null or p_beat_id is null then
    raise exception using errcode = '22023', message = 'Usuario y beat son obligatorios.';
  end if;

  if char_length(v_reason) < 5 or char_length(v_reason) > 500 then
    raise exception using errcode = '22023', message = 'El motivo debe tener entre 5 y 500 caracteres.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_beat_id::text, 0)
  );

  delete from public.beat_access
  where user_id = p_user_id
    and beat_id = p_beat_id
  returning id into v_access_id;

  if v_access_id is null then
    return jsonb_build_object(
      'revoked', false,
      'already_revoked', true,
      'revocation_id', null
    );
  end if;

  insert into public.access_revocations (
    user_id,
    beat_id,
    reason,
    revoked_by,
    revoked_at
  )
  values (
    p_user_id,
    p_beat_id,
    v_reason,
    auth.uid(),
    now()
  )
  returning id into v_revocation_id;

  return jsonb_build_object(
    'revoked', true,
    'already_revoked', false,
    'revocation_id', v_revocation_id
  );
end;
$$;

create or replace function public.approve_access_request_atomic(
  p_request_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.access_requests%rowtype;
begin
  if auth.uid() is null or not private.is_br_admin() then
    raise exception using errcode = '42501', message = 'Esta accion requiere permisos de administrador.';
  end if;

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Solicitud no encontrada.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_request.user_id::text || ':' || v_request.beat_id::text, 0)
  );

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id
  for update;

  if v_request.status = 'fulfilled' then
    return jsonb_build_object(
      'request_id', p_request_id,
      'status', 'fulfilled',
      'access_created', false,
      'payment_required', false
    );
  end if;

  if v_request.status <> 'payment_pending'
    and v_request.status not in ('pending', 'contacted', 'paid', 'review_pending', 'approved') then
    raise exception using
      errcode = '22023',
      message = format('No se puede aprobar una solicitud desde el estado %s.', v_request.status);
  end if;

  if v_request.status <> 'payment_pending' then
    update public.access_requests
    set
      status = 'payment_pending',
      responded_at = now(),
      updated_at = now()
    where id = p_request_id;
  end if;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'payment_pending',
    'access_created', false,
    'payment_required', true
  );
end;
$$;

create or replace function public.reject_access_request_atomic(
  p_request_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.access_requests%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if auth.uid() is null or not private.is_br_admin() then
    raise exception using errcode = '42501', message = 'Esta accion requiere permisos de administrador.';
  end if;

  if char_length(v_reason) < 5 or char_length(v_reason) > 500 then
    raise exception using errcode = '22023', message = 'El motivo debe tener entre 5 y 500 caracteres.';
  end if;

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Solicitud no encontrada.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_request.user_id::text || ':' || v_request.beat_id::text, 0)
  );

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id
  for update;

  if exists (
    select 1
    from public.beat_access as active_access
    where active_access.user_id = v_request.user_id
      and active_access.beat_id = v_request.beat_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'La solicitud no puede rechazarse porque el acceso ya esta activo.';
  end if;

  if v_request.status = 'rejected' then
    return jsonb_build_object(
      'request_id', p_request_id,
      'status', 'rejected',
      'already_rejected', true
    );
  end if;

  if v_request.status not in ('pending', 'contacted', 'payment_pending', 'paid') then
    raise exception using
      errcode = '22023',
      message = format('No se puede rechazar una solicitud con estado %s.', v_request.status);
  end if;

  update public.access_requests
  set
    status = 'rejected',
    rejection_reason = v_reason,
    rejected_at = now(),
    rejected_by = auth.uid(),
    responded_at = now(),
    updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'rejected',
    'already_rejected', false
  );
end;
$$;

create or replace function public.record_manual_payment_atomic(
  p_user_id uuid,
  p_beat_id uuid,
  p_amount numeric,
  p_currency text,
  p_payment_method text default null,
  p_note text default null,
  p_license_type text default 'basic'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_user_email text;
  v_beat_title text;
  v_beat_slug text;
  v_payment_id uuid;
  v_access_id uuid;
  v_payment_created boolean := false;
  v_access_created boolean := false;
  v_activity_created boolean := false;
  v_request_count integer := 0;
  v_currency text := upper(btrim(coalesce(p_currency, '')));
  v_license_type text := lower(btrim(coalesce(p_license_type, 'basic')));
begin
  if v_admin_id is null or not exists (
    select 1
    from public.profiles
    where id = v_admin_id
      and role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Esta accion requiere permisos de administrador.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Monto invalido.';
  end if;

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception using errcode = '22023', message = 'Moneda invalida.';
  end if;

  if v_license_type not in ('basic', 'premium', 'exclusive') then
    raise exception using errcode = '22023', message = 'Tipo de licencia invalido.';
  end if;

  select email into v_user_email
  from public.profiles
  where id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Usuario no encontrado.';
  end if;

  select title, slug into v_beat_title, v_beat_slug
  from public.beats
  where id = p_beat_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Beat no encontrado.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_beat_id::text, 0)
  );

  select id into v_payment_id
  from public.manual_payments
  where user_id = p_user_id
    and beat_id = p_beat_id
  for update;

  if v_payment_id is null then
    insert into public.manual_payments (
      user_id,
      user_email,
      beat_id,
      beat_title,
      amount,
      currency,
      payment_method,
      note,
      created_by_admin,
      license_type
    )
    values (
      p_user_id,
      v_user_email,
      p_beat_id,
      v_beat_title,
      p_amount,
      v_currency,
      nullif(btrim(coalesce(p_payment_method, '')), ''),
      nullif(btrim(coalesce(p_note, '')), ''),
      v_admin_id,
      v_license_type
    )
    returning id into v_payment_id;

    v_payment_created := true;
  end if;

  insert into public.beat_access (user_id, beat_id, granted_by)
  values (p_user_id, p_beat_id, v_admin_id)
  on conflict (user_id, beat_id) do nothing
  returning id into v_access_id;

  v_access_created := v_access_id is not null;

  update public.access_requests
  set
    status = 'fulfilled',
    responded_at = now(),
    updated_at = now()
  where user_id = p_user_id
    and beat_id = p_beat_id
    and status in ('pending', 'contacted', 'payment_pending', 'paid', 'approved', 'rejected');

  get diagnostics v_request_count = row_count;

  if not exists (
    select 1
    from public.commercial_activity
    where event_type = 'manual_payment'
      and user_id = p_user_id
      and beat_id = p_beat_id
  ) then
    insert into public.commercial_activity (
      event_type,
      user_id,
      user_email,
      beat_id,
      beat_title,
      beat_slug,
      metadata
    )
    values (
      'manual_payment',
      p_user_id,
      v_user_email,
      p_beat_id,
      v_beat_title,
      v_beat_slug,
      jsonb_build_object(
        'amount', p_amount,
        'currency', v_currency,
        'payment_method', nullif(btrim(coalesce(p_payment_method, '')), ''),
        'note', nullif(btrim(coalesce(p_note, '')), ''),
        'created_by_admin', v_admin_id,
        'license_type', v_license_type,
        'manual_payment_id', v_payment_id,
        'access_granted', true,
        'access_was_created', v_access_created,
        'payment_was_created', v_payment_created,
        'previous_revocation_preserved', true
      )
    );

    v_activity_created := true;
  end if;

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'payment_created', v_payment_created,
    'access_created', v_access_created,
    'request_updated', v_request_count > 0,
    'activity_created', v_activity_created,
    'revocation_preserved', true
  );
end;
$$;

revoke execute on function public.grant_beat_access_atomic(uuid, uuid) from public, anon, service_role;
revoke execute on function public.revoke_beat_access_atomic(uuid, uuid, text) from public, anon, service_role;
revoke execute on function public.approve_access_request_atomic(uuid) from public, anon, service_role;
revoke execute on function public.reject_access_request_atomic(uuid, text) from public, anon, service_role;
revoke execute on function public.record_manual_payment_atomic(uuid, uuid, numeric, text, text, text, text) from public, anon, service_role;

grant execute on function public.grant_beat_access_atomic(uuid, uuid) to authenticated;
grant execute on function public.revoke_beat_access_atomic(uuid, uuid, text) to authenticated;
grant execute on function public.approve_access_request_atomic(uuid) to authenticated;
grant execute on function public.reject_access_request_atomic(uuid, text) to authenticated;
grant execute on function public.record_manual_payment_atomic(uuid, uuid, numeric, text, text, text, text) to authenticated;
