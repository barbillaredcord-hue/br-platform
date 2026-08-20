-- B.R - Reabre solicitudes cerradas sin limitar la cantidad de rechazos históricos.
-- Conserva beat_access como autoridad actual y ejecuta la transición en una sola RPC.

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
    raise exception using errcode = 'P0002', message = 'Solicitud no encontrada.';
  end if;

  if v_request.user_id <> v_user_id then
    raise exception using errcode = '42501', message = 'Solo el propietario puede reabrir esta solicitud.';
  end if;

  if v_request.status in ('pending', 'contacted', 'payment_pending', 'paid', 'review_pending') then
    raise exception using errcode = '23505', message = 'Ya existe una solicitud activa para este beat.';
  end if;

  if exists (
    select 1
    from public.beat_access as active_access
    where active_access.user_id = v_user_id
      and active_access.beat_id = v_request.beat_id
  ) then
    raise exception using errcode = '22023', message = 'Ya tienes acceso comercial vigente a este beat.';
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
