-- B.R - Etapa 1: base de datos para solicitudes, revisiones y rechazos.
-- Migracion incremental e idempotente.
-- No modifica datos existentes, beat_access, access_revocations, grants ni RLS.

begin;

alter table public.access_requests
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_context text,
  add column if not exists review_revocation_id uuid references public.access_revocations(id) on delete set null,
  add column if not exists review_requested_at timestamptz,
  add column if not exists review_rejection_reason text,
  add column if not exists review_rejected_at timestamptz,
  add column if not exists review_rejected_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_rejection_acknowledged_at timestamptz;

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
      'review_rejected',
      'cancelled'
    )
  );

alter table public.access_requests
  drop constraint if exists access_requests_review_context_check;

alter table public.access_requests
  add constraint access_requests_review_context_check
  check (
    review_context is null
    or review_context in ('initial_rejection', 'access_revocation')
  );

alter table public.access_requests
  drop constraint if exists access_requests_rejection_reason_length_check;

alter table public.access_requests
  add constraint access_requests_rejection_reason_length_check
  check (
    rejection_reason is null
    or char_length(btrim(rejection_reason)) between 5 and 500
  );

alter table public.access_requests
  drop constraint if exists access_requests_review_rejection_reason_length_check;

alter table public.access_requests
  add constraint access_requests_review_rejection_reason_length_check
  check (
    review_rejection_reason is null
    or char_length(btrim(review_rejection_reason)) between 5 and 500
  );

create index if not exists access_requests_review_status_idx
  on public.access_requests(status)
  where status in ('review_pending', 'review_rejected');

create index if not exists access_requests_review_revocation_idx
  on public.access_requests(review_revocation_id)
  where review_revocation_id is not null;

commit;
