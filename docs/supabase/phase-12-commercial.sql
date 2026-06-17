-- Fase 12 comercial - auditoria y pagos manuales.
-- Ejecutar manualmente en Supabase SQL Editor despues del schema base.
-- Incremental: no modifica tablas existentes ni cambia reglas de catalogo.

create extension if not exists pgcrypto;

create table if not exists public.commercial_activity (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  beat_id uuid references public.beats(id) on delete set null,
  beat_title text,
  beat_slug text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint commercial_activity_event_type_check check (event_type in ('mp3_download', 'license_download', 'manual_payment'))
);

create index if not exists commercial_activity_created_at_idx on public.commercial_activity (created_at desc);
create index if not exists commercial_activity_event_type_idx on public.commercial_activity (event_type);
create index if not exists commercial_activity_user_id_idx on public.commercial_activity (user_id);
create index if not exists commercial_activity_beat_id_idx on public.commercial_activity (beat_id);

alter table public.commercial_activity enable row level security;

revoke all on public.commercial_activity from anon, authenticated;
grant select on public.commercial_activity to authenticated;

drop policy if exists "commercial_activity_select_admin" on public.commercial_activity;
create policy "commercial_activity_select_admin"
on public.commercial_activity
for select
to authenticated
using (private.is_br_admin());

create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  beat_id uuid references public.beats(id) on delete set null,
  beat_title text,
  amount numeric(10,2) not null,
  currency text not null default 'MXN',
  payment_method text,
  note text,
  created_by_admin uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint manual_payments_amount_check check (amount > 0),
  constraint manual_payments_currency_check check (currency ~ '^[A-Z]{3}$')
);

create index if not exists manual_payments_created_at_idx on public.manual_payments (created_at desc);
create index if not exists manual_payments_user_id_idx on public.manual_payments (user_id);
create index if not exists manual_payments_beat_id_idx on public.manual_payments (beat_id);
create index if not exists manual_payments_created_by_admin_idx on public.manual_payments (created_by_admin);

alter table public.manual_payments enable row level security;

revoke all on public.manual_payments from anon, authenticated;
grant select on public.manual_payments to authenticated;

drop policy if exists "manual_payments_select_admin" on public.manual_payments;
create policy "manual_payments_select_admin"
on public.manual_payments
for select
to authenticated
using (private.is_br_admin());

-- 12L.1 - Evita pagos manuales duplicados por usuario + beat.
create unique index if not exists manual_payments_user_beat_unique_idx
on public.manual_payments (user_id, beat_id)
where user_id is not null and beat_id is not null;
