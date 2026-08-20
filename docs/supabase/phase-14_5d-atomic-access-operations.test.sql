-- B.R Fase 14.5D - pruebas transaccionales y failure injection.
-- Ejecutar como postgres. Todo el escenario termina con ROLLBACK.

begin;

create temporary table br_145d_test_context (
  admin_id uuid not null,
  user_id uuid not null
) on commit drop;

insert into br_145d_test_context (admin_id, user_id)
select
  (select id from public.profiles where role = 'admin' order by created_at limit 1),
  (select id from public.profiles where role <> 'admin' order by created_at limit 1);

grant select on br_145d_test_context to authenticated;

do $$
begin
  if exists (
    select 1
    from br_145d_test_context
    where admin_id is null or user_id is null
  ) then
    raise exception '14.5D test requires one admin and one non-admin profile';
  end if;
end;
$$;

insert into public.beats (
  id,
  slug,
  title,
  preview_url,
  full_audio_url,
  playback_visibility,
  is_active
)
values
  ('145d0000-0000-4000-8000-000000000001', 'br-145d-test-grant', 'BR 14.5D Test Grant', '/audio/preview/test.mp3', 'storage://beat-full/test-grant.mp3', 'private', false),
  ('145d0000-0000-4000-8000-000000000002', 'br-145d-test-approve', 'BR 14.5D Test Approve', '/audio/preview/test.mp3', 'storage://beat-full/test-approve.mp3', 'private', false),
  ('145d0000-0000-4000-8000-000000000003', 'br-145d-test-reject', 'BR 14.5D Test Reject', '/audio/preview/test.mp3', 'storage://beat-full/test-reject.mp3', 'private', false),
  ('145d0000-0000-4000-8000-000000000004', 'br-145d-test-payment', 'BR 14.5D Test Payment', '/audio/preview/test.mp3', 'storage://beat-full/test-payment.mp3', 'private', false),
  ('145d0000-0000-4000-8000-000000000005', 'br-145d-test-payment-fail', 'BR 14.5D Test Payment Failure', '/audio/preview/test.mp3', 'storage://beat-full/test-payment-fail.mp3', 'private', false),
  ('145d0000-0000-4000-8000-000000000006', 'br-145d-test-grant-fail', 'BR 14.5D Test Grant Failure', '/audio/preview/test.mp3', 'storage://beat-full/test-grant-fail.mp3', 'private', false);

insert into public.access_requests (user_id, beat_id, status, message)
select context.user_id, beat.id, 'pending', 'BR 14.5D atomic test'
from br_145d_test_context as context
cross join public.beats as beat
where beat.id in (
  '145d0000-0000-4000-8000-000000000001',
  '145d0000-0000-4000-8000-000000000002',
  '145d0000-0000-4000-8000-000000000003',
  '145d0000-0000-4000-8000-000000000004',
  '145d0000-0000-4000-8000-000000000005',
  '145d0000-0000-4000-8000-000000000006'
);

create function pg_temp.br_145d_fail_request_fulfillment()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'fulfilled'
    and new.beat_id = '145d0000-0000-4000-8000-000000000006' then
    raise exception using errcode = '23514', message = 'BR 14.5D forced request failure';
  end if;
  return new;
end;
$$;

create trigger br_145d_fail_request_fulfillment
before update on public.access_requests
for each row execute function pg_temp.br_145d_fail_request_fulfillment();

create function pg_temp.br_145d_fail_revocation()
returns trigger
language plpgsql
as $$
begin
  if new.beat_id = '145d0000-0000-4000-8000-000000000001'
    and new.reason = 'BR_145D_FORCE_REVOKE_FAILURE' then
    raise exception using errcode = '23514', message = 'BR 14.5D forced revocation failure';
  end if;
  return new;
end;
$$;

create trigger br_145d_fail_revocation
before insert on public.access_revocations
for each row execute function pg_temp.br_145d_fail_revocation();

create function pg_temp.br_145d_fail_payment_activity()
returns trigger
language plpgsql
as $$
begin
  if new.event_type = 'manual_payment'
    and new.beat_id = '145d0000-0000-4000-8000-000000000005' then
    raise exception using errcode = '23514', message = 'BR 14.5D forced payment activity failure';
  end if;
  return new;
end;
$$;

create trigger br_145d_fail_payment_activity
before insert on public.commercial_activity
for each row execute function pg_temp.br_145d_fail_payment_activity();

select set_config(
  'request.jwt.claim.sub',
  (select admin_id::text from br_145d_test_context),
  true
);

set local role authenticated;

do $$
declare
  v_user_id uuid := (select user_id from br_145d_test_context);
  v_request_id uuid;
begin
  -- A/B: grant exitoso y repetido.
  perform public.grant_beat_access_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000001'
  );
  perform public.grant_beat_access_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000001'
  );

  if (select count(*) from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'A/B failed: grant is not idempotent';
  end if;

  if not exists (select 1 from public.access_requests where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001' and status = 'fulfilled') then
    raise exception 'A failed: request workflow was not fulfilled';
  end if;

  -- C/E/M: revoke, restore e historial preservado.
  perform public.revoke_beat_access_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000001',
    'Revocacion atomica de prueba'
  );

  if exists (select 1 from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001') then
    raise exception 'C failed: access remains after revoke';
  end if;

  if (select count(*) from public.access_revocations where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'C failed: revocation history missing';
  end if;

  perform public.grant_beat_access_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000001'
  );

  if not exists (select 1 from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001')
    or (select count(*) from public.access_revocations where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'E/M failed: restore did not preserve history';
  end if;

  -- D: failure injection en la segunda escritura de revoke.
  begin
    perform public.revoke_beat_access_atomic(
      v_user_id,
      '145d0000-0000-4000-8000-000000000001',
      'BR_145D_FORCE_REVOKE_FAILURE'
    );
    raise exception 'D failed: forced revoke failure did not fail';
  exception
    when check_violation then null;
  end;

  if not exists (select 1 from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001')
    or (select count(*) from public.access_revocations where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'D failed: revoke left partial state';
  end if;

  -- Failure injection: grant revierte beat_access si falla workflow.
  begin
    perform public.grant_beat_access_atomic(
      v_user_id,
      '145d0000-0000-4000-8000-000000000006'
    );
    raise exception 'Grant rollback failed: forced workflow failure did not fail';
  exception
    when check_violation then null;
  end;

  if exists (select 1 from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000006')
    or not exists (select 1 from public.access_requests where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000006' and status = 'pending') then
    raise exception 'Grant rollback failed: partial state remains';
  end if;

  -- F/G: aprobar deja pago pendiente, no concede acceso y el retry es idempotente.
  select id into v_request_id
  from public.access_requests
  where user_id = v_user_id
    and beat_id = '145d0000-0000-4000-8000-000000000002';

  perform public.approve_access_request_atomic(v_request_id);
  perform public.approve_access_request_atomic(v_request_id);

  if exists (select 1 from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000002')
    or not exists (select 1 from public.access_requests where id = v_request_id and status = 'payment_pending') then
    raise exception 'F/G failed: approve is not coherent or idempotent';
  end if;

  -- H: reject no puede contradecir acceso activo.
  perform public.grant_beat_access_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000003'
  );

  select id into v_request_id
  from public.access_requests
  where user_id = v_user_id
    and beat_id = '145d0000-0000-4000-8000-000000000003';

  begin
    perform public.reject_access_request_atomic(v_request_id, 'Rechazo no permitido con acceso');
    raise exception 'H failed: reject accepted active access';
  exception
    when check_violation then null;
  end;

  if exists (select 1 from public.access_requests where id = v_request_id and status = 'rejected') then
    raise exception 'H failed: request became rejected with active access';
  end if;

  -- Reject valido después de retirar acceso y reabrir workflow dentro del test.
  perform public.revoke_beat_access_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000003',
    'Preparacion controlada para reject'
  );
  update public.access_requests set status = 'pending' where id = v_request_id;
  perform public.reject_access_request_atomic(v_request_id, 'Rechazo atomico de prueba');

  if not exists (select 1 from public.access_requests where id = v_request_id and status = 'rejected') then
    raise exception 'Reject failed: valid request was not rejected';
  end if;

  -- I/J: pago manual completa el pago pendiente y retry no duplica.
  select id into v_request_id
  from public.access_requests
  where user_id = v_user_id
    and beat_id = '145d0000-0000-4000-8000-000000000004';

  perform public.approve_access_request_atomic(v_request_id);

  perform public.record_manual_payment_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000004',
    100,
    'MXN',
    'test',
    '14.5D',
    'basic'
  );
  perform public.record_manual_payment_atomic(
    v_user_id,
    '145d0000-0000-4000-8000-000000000004',
    100,
    'MXN',
    'test',
    '14.5D retry',
    'basic'
  );

  if (select count(*) from public.manual_payments where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000004') <> 1
    or (select count(*) from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000004') <> 1
    or (select count(*) from public.commercial_activity where event_type = 'manual_payment' and user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000004') <> 1
    or not exists (select 1 from public.access_requests where id = v_request_id and status = 'fulfilled') then
    raise exception 'I/J failed: manual payment retry duplicated or missed state';
  end if;

  -- K: fallo en commercial_activity revierte pago, acceso y workflow.
  select id into v_request_id
  from public.access_requests
  where user_id = v_user_id
    and beat_id = '145d0000-0000-4000-8000-000000000005';

  perform public.approve_access_request_atomic(v_request_id);

  begin
    perform public.record_manual_payment_atomic(
      v_user_id,
      '145d0000-0000-4000-8000-000000000005',
      100,
      'MXN',
      'test',
      '14.5D forced failure',
      'basic'
    );
    raise exception 'K failed: forced payment failure did not fail';
  exception
    when check_violation then null;
  end;

  if exists (select 1 from public.manual_payments where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000005')
    or exists (select 1 from public.beat_access where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000005')
    or exists (select 1 from public.commercial_activity where event_type = 'manual_payment' and user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000005')
    or not exists (select 1 from public.access_requests where user_id = v_user_id and beat_id = '145d0000-0000-4000-8000-000000000005' and status = 'payment_pending') then
    raise exception 'K failed: manual payment left partial state';
  end if;

  -- L: las RPC escriben beat_access y conservan el trigger 14.5C.
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.beat_access'::regclass
      and tgname = 'beat_access_realtime_changes'
      and not tgisinternal
  ) then
    raise exception 'L failed: Realtime trigger is missing';
  end if;
end;
$$;

select 'PASS: 14.5D atomic operations, rollback and idempotency' as result;

rollback;
