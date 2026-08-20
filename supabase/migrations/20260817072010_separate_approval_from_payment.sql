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
