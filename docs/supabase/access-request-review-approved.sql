-- B.R: separa aceptar una revisión de restaurar el acceso.
-- Idempotente. No ejecuta grants, revocaciones, pagos ni cambios de RLS.

begin;

alter table public.access_requests
  drop constraint if exists access_requests_status_check;

alter table public.access_requests
  add constraint access_requests_status_check
  check (
    status in (
      'pending',
      'contacted',
      'payment_pending',
      'paid',
      'fulfilled',
      'approved',
      'rejected',
      'review_pending',
      'review_approved',
      'review_rejected',
      'cancelled'
    )
  );

drop index if exists public.access_requests_review_status_idx;

create index access_requests_review_status_idx
  on public.access_requests(status)
  where status in ('review_pending', 'review_approved', 'review_rejected');

commit;
