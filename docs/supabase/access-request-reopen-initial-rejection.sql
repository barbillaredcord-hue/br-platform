-- B.R - Permite reutilizar la solicitud del mismo usuario y beat tras un rechazo inicial.
-- Idempotente. No modifica datos existentes, beat_access, access_revocations ni RLS.

begin;

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

  if v_request.status not in ('rejected', 'review_rejected') then
    raise exception using
      errcode = '22023',
      message = 'La solicitud no puede reabrirse desde su estado actual.';
  end if;

  if v_request.status = 'review_rejected'
    and v_request.review_rejection_acknowledged_at is null then
    raise exception using
      errcode = '22023',
      message = 'Primero debes aceptar el motivo del rechazo.';
  end if;

  update public.access_requests as request
  set
    status = 'pending',
    rejection_reason = null,
    rejected_at = null,
    rejected_by = null,
    review_context = null,
    review_revocation_id = null,
    review_requested_at = null,
    review_rejection_reason = null,
    review_rejected_at = null,
    review_rejected_by = null,
    review_rejection_acknowledged_at = null,
    responded_at = null,
    contacted_at = null,
    updated_at = now()
  where request.id = p_request_id
  returning request.* into v_request;

  return v_request;
end;
$$;

revoke all on function public.reopen_access_request(uuid)
  from public, anon;

grant execute on function public.reopen_access_request(uuid)
  to authenticated;

commit;
