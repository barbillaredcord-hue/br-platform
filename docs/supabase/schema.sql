-- B.R Fase 10A - Esquema inicial Supabase
-- Ejecutar manualmente en Supabase Dashboard > SQL Editor.
-- Este archivo crea estructura real; no migra la app ni inserta datos demo.

create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text unique,
  display_name text,
  role text not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint profiles_role_check check (role in ('admin', 'user'))
);

create table if not exists public.beats (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  genre text,
  bpm integer,
  musical_key text,
  preview_url text not null,
  full_audio_url text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint beats_bpm_check check (bpm is null or bpm between 40 and 240)
);

create table if not exists public.beat_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  beat_id uuid references public.beats(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz default now(),
  unique (user_id, beat_id)
);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  beat_id uuid references public.beats(id) on delete cascade,
  status text default 'pending',
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, beat_id),
  constraint access_requests_status_check check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists beats_slug_idx on public.beats (slug);
create index if not exists beat_access_user_id_idx on public.beat_access (user_id);
create index if not exists beat_access_beat_id_idx on public.beat_access (beat_id);
create index if not exists access_requests_status_idx on public.access_requests (status);
create index if not exists access_requests_user_id_idx on public.access_requests (user_id);
create index if not exists access_requests_beat_id_idx on public.access_requests (beat_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists beats_set_updated_at on public.beats;
create trigger beats_set_updated_at
before update on public.beats
for each row execute function public.set_updated_at();

drop trigger if exists access_requests_set_updated_at on public.access_requests;
create trigger access_requests_set_updated_at
before update on public.access_requests
for each row execute function public.set_updated_at();

-- Admin helper:
-- Después de crear el perfil del B.RCEO, asignar role = 'admin'.
-- Ejemplo:
-- update public.profiles set role = 'admin' where email = 'tu-email-brceo@dominio.com';
create or replace function private.is_br_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_br_admin() from public, anon, authenticated;
grant execute on function private.is_br_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.beats enable row level security;
alter table public.beat_access enable row level security;
alter table public.access_requests enable row level security;

grant select on public.beats to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.beat_access to authenticated;
grant select, insert, update, delete on public.access_requests to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or private.is_br_admin()
);

drop policy if exists "beats_select_active" on public.beats;
create policy "beats_select_active"
on public.beats
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "beats_select_all_admin" on public.beats;
create policy "beats_select_all_admin"
on public.beats
for select
to authenticated
using (private.is_br_admin());

drop policy if exists "beat_access_select_own_or_admin" on public.beat_access;
create policy "beat_access_select_own_or_admin"
on public.beat_access
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_br_admin()
);

drop policy if exists "beat_access_admin_insert" on public.beat_access;
create policy "beat_access_admin_insert"
on public.beat_access
for insert
to authenticated
with check (private.is_br_admin());

drop policy if exists "beat_access_admin_update" on public.beat_access;
create policy "beat_access_admin_update"
on public.beat_access
for update
to authenticated
using (private.is_br_admin())
with check (private.is_br_admin());

drop policy if exists "beat_access_admin_delete" on public.beat_access;
create policy "beat_access_admin_delete"
on public.beat_access
for delete
to authenticated
using (private.is_br_admin());

drop policy if exists "access_requests_select_own_or_admin" on public.access_requests;
create policy "access_requests_select_own_or_admin"
on public.access_requests
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_br_admin()
);

drop policy if exists "access_requests_insert_own_or_admin" on public.access_requests;
create policy "access_requests_insert_own_or_admin"
on public.access_requests
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or private.is_br_admin()
);

drop policy if exists "access_requests_admin_update" on public.access_requests;
create policy "access_requests_admin_update"
on public.access_requests
for update
to authenticated
using (private.is_br_admin())
with check (private.is_br_admin());

drop policy if exists "access_requests_admin_delete" on public.access_requests;
create policy "access_requests_admin_delete"
on public.access_requests
for delete
to authenticated
using (private.is_br_admin());
