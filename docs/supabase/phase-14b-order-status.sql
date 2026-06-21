-- Fase 14B - Estados formales de orden sobre access_requests.
-- Ejecutar manualmente en Supabase SQL Editor.
-- Incremental: no borra datos, no toca beat_access, manual_payments ni playback_visibility.

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
    'cancelled'
  )
);

create index if not exists access_requests_status_idx
on public.access_requests (status);

create index if not exists access_requests_contacted_at_idx
on public.access_requests (contacted_at desc);

create index if not exists access_requests_responded_at_idx
on public.access_requests (responded_at desc);
