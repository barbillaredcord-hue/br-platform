-- B.R Fase 14D - historial administrativo real
-- Ejecutar manualmente en Supabase Dashboard > SQL Editor.

create table if not exists public.admin_change_logs (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  block_title text not null,
  event_type text not null,
  target_type text null,
  target_name text null,
  description text not null,
  command_text text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  is_deleted boolean not null default false
);

alter table public.admin_change_logs enable row level security;

drop policy if exists "Admins can select admin change logs" on public.admin_change_logs;
create policy "Admins can select admin change logs"
on public.admin_change_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can insert admin change logs" on public.admin_change_logs;
create policy "Admins can insert admin change logs"
on public.admin_change_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update admin change logs" on public.admin_change_logs;
create policy "Admins can update admin change logs"
on public.admin_change_logs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create index if not exists admin_change_logs_year_idx on public.admin_change_logs (year);
create index if not exists admin_change_logs_created_at_idx on public.admin_change_logs (created_at desc);
create index if not exists admin_change_logs_is_deleted_idx on public.admin_change_logs (is_deleted);
create index if not exists admin_change_logs_expires_at_idx on public.admin_change_logs (expires_at);
