-- B.R - Etapa 3: transiciones seguras de usuario para access_requests.
-- No modifica datos historicos, beat_access, access_revocations, pagos ni RLS administrativo.

begin;

drop policy if exists "Users can reopen rejected or cancelled access requests"
  on public.access_requests;

create or replace function public.request_access_review(
  p_request_id uuid,
  p_review_context text,
  p_review_revocation_id uuid default null
)
returns public.access_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.access_requests%rowtype;
  v_latest_revocation_id uuid;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesion para pedir una revision.';
  end if;

  if p_review_context not in ('initial_rejection', 'access_revocation') then
    raise exception using
      errcode = '22023',
      message = 'El contexto de revision no es valido.';
  end if;

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Solicitud no encontrada.';
  end if;

  if v_request.user_id <> v_user_id then
    raise exception using
      errcode = '42501',
      message = 'Solo el propietario puede pedir revision.';
  end if;

  if v_request.status = 'review_pending' then
    raise exception using
      errcode = '23505',
      message = 'Ya existe una revision pendiente.';
  end if;

  if p_review_context = 'initial_rejection' then
    if v_request.status <> 'rejected' then
      raise exception using
        errcode = '22023',
        message = 'Solo una solicitud rechazada puede pedir esta revision.';
    end if;

    if p_review_revocation_id is not null then
      raise exception using
        errcode = '22023',
        message = 'Una revision de rechazo inicial no admite revocacion vinculada.';
    end if;
  else
    if p_review_revocation_id is null then
      raise exception using
        errcode = '22023',
        message = 'La revision debe vincularse a una revocacion.';
    end if;

    if v_request.status in (
      'pending',
      'contacted',
      'payment_pending',
      'paid',
      'review_pending',
      'review_rejected'
    ) then
      raise exception using
        errcode = '22023',
        message = 'El estado actual no permite revisar una revocacion.';
    end if;

    select revocation.id
    into v_latest_revocation_id
    from public.access_revocations as revocation
    where revocation.user_id = v_user_id
      and revocation.beat_id = v_request.beat_id
    order by revocation.revoked_at desc, revocation.created_at desc
    limit 1;

    if v_latest_revocation_id is null
      or v_latest_revocation_id <> p_review_revocation_id then
      raise exception using
        errcode = '22023',
        message = 'La revocacion vinculada no es valida o no es la mas reciente.';
    end if;

    if exists (
      select 1
      from public.beat_access as active_access
      where active_access.user_id = v_user_id
        and active_access.beat_id = v_request.beat_id
    ) then
      raise exception using
        errcode = '22023',
        message = 'El acceso esta activo y no puede revisarse como revocado.';
    end if;
  end if;

  update public.access_requests as request
  set
    status = 'review_pending',
    review_context = p_review_context,
    review_revocation_id = p_review_revocation_id,
    review_requested_at = now(),
    review_rejection_reason = null,
    review_rejected_at = null,
    review_rejected_by = null,
    review_rejection_acknowledged_at = null,
    responded_at = null,
    updated_at = now()
  where request.id = p_request_id
  returning request.* into v_request;

  return v_request;
end;
$$;

create or replace function public.acknowledge_access_review_rejection(
  p_request_id uuid
)
returns public.access_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.access_requests%rowtype;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesion para aceptar el rechazo.';
  end if;

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Solicitud no encontrada.';
  end if;

  if v_request.user_id <> v_user_id then
    raise exception using
      errcode = '42501',
      message = 'Solo el propietario puede aceptar este rechazo.';
  end if;

  if v_request.status <> 'review_rejected' then
    raise exception using
      errcode = '22023',
      message = 'Solo un rechazo de revision puede aceptarse.';
  end if;

  if v_request.review_rejection_acknowledged_at is not null then
    raise exception using
      errcode = '22023',
      message = 'El motivo del rechazo ya fue aceptado.';
  end if;

  update public.access_requests as request
  set
    review_rejection_acknowledged_at = now(),
    updated_at = now()
  where request.id = p_request_id
  returning request.* into v_request;

  return v_request;
end;
$$;

create or replace function public.reopen_access_request(
  p_request_id uuid
)
returns public.access_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.access_requests%rowtype;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesion para volver a solicitar acceso.';
  end if;

  select request.*
  into v_request
  from public.access_requests as request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Solicitud no encontrada.';
  end if;

  if v_request.user_id <> v_user_id then
    raise exception using
      errcode = '42501',
      message = 'Solo el propietario puede reabrir esta solicitud.';
  end if;

  if v_request.status <> 'review_rejected' then
    raise exception using
      errcode = '22023',
      message = 'Solo una revision rechazada puede volver a solicitar acceso.';
  end if;

  if v_request.review_rejection_acknowledged_at is null then
    raise exception using
      errcode = '22023',
      message = 'Primero debes aceptar el motivo del rechazo.';
  end if;

  update public.access_requests as request
  set
    status = 'pending',
    review_context = null,
    review_revocation_id = null,
    review_requested_at = null,
    review_rejection_acknowledged_at = null,
    responded_at = null,
    contacted_at = null,
    updated_at = now()
  where request.id = p_request_id
  returning request.* into v_request;

  return v_request;
end;
$$;

revoke all on function public.request_access_review(uuid, text, uuid)
  from public, anon;
revoke all on function public.acknowledge_access_review_rejection(uuid)
  from public, anon;
revoke all on function public.reopen_access_request(uuid)
  from public, anon;

grant execute on function public.request_access_review(uuid, text, uuid)
  to authenticated;
grant execute on function public.acknowledge_access_review_rejection(uuid)
  to authenticated;
grant execute on function public.reopen_access_request(uuid)
  to authenticated;

commit;
