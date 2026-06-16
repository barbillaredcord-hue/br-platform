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
  phone text,
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
  contacted_at timestamptz,
  responded_at timestamptz,
  unique (user_id, beat_id),
  constraint access_requests_status_check check (status in ('pending', 'approved', 'rejected', 'contacted'))
);

create table if not exists public.account_access_recovery (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  beat_id uuid references public.beats(id) on delete cascade,
  source_user_id uuid,
  closed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  restored_user_id uuid references public.profiles(id) on delete set null,
  restored_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (email, beat_id)
);

create index if not exists beats_slug_idx on public.beats (slug);
create index if not exists beat_access_user_id_idx on public.beat_access (user_id);
create index if not exists beat_access_beat_id_idx on public.beat_access (beat_id);
create index if not exists access_requests_status_idx on public.access_requests (status);
create index if not exists access_requests_user_id_idx on public.access_requests (user_id);
create index if not exists access_requests_beat_id_idx on public.access_requests (beat_id);
create index if not exists account_access_recovery_email_idx on public.account_access_recovery (email);
create index if not exists account_access_recovery_expires_at_idx on public.account_access_recovery (expires_at);
create index if not exists account_access_recovery_source_user_id_idx on public.account_access_recovery (source_user_id);
create index if not exists account_access_recovery_restored_user_id_idx on public.account_access_recovery (restored_user_id);

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

drop trigger if exists account_access_recovery_set_updated_at on public.account_access_recovery;
create trigger account_access_recovery_set_updated_at
before update on public.account_access_recovery
for each row execute function public.set_updated_at();

-- Automatically create a public profile when a Supabase Auth user is created.
-- This avoids client-side profile insert failures when RLS is active.
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  brceo_email text := lower(nullif(current_setting('app.brceo_email', true), ''));
  new_email text := lower(coalesce(new.email, ''));
begin
  insert into public.profiles (
    id,
    email,
    username,
    display_name,
    phone,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case
      when brceo_email is not null and brceo_email <> '' and new_email = brceo_email then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();

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
alter table public.account_access_recovery enable row level security;

grant select on public.beats to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.beat_access to authenticated;
grant select, insert, update, delete on public.access_requests to authenticated;
grant select, insert, update, delete on public.account_access_recovery to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or private.is_br_admin()
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and role = 'user'
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and role = public.profiles.role
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or private.is_br_admin()
)
with check (
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

drop policy if exists "account_access_recovery_select_admin" on public.account_access_recovery;
create policy "account_access_recovery_select_admin"
on public.account_access_recovery
for select
to authenticated
using (private.is_br_admin());

drop policy if exists "account_access_recovery_insert_admin" on public.account_access_recovery;
create policy "account_access_recovery_insert_admin"
on public.account_access_recovery
for insert
to authenticated
with check (private.is_br_admin());

drop policy if exists "account_access_recovery_update_admin" on public.account_access_recovery;
create policy "account_access_recovery_update_admin"
on public.account_access_recovery
for update
to authenticated
using (private.is_br_admin())
with check (private.is_br_admin());

drop policy if exists "account_access_recovery_delete_admin" on public.account_access_recovery;
create policy "account_access_recovery_delete_admin"
on public.account_access_recovery
for delete
to authenticated
using (private.is_br_admin());

-- Fase 11B - SQL adicional para proyectos que ya ejecutaron el esquema antes de agregar phone.
-- Ejecutar en Supabase SQL Editor si public.profiles aún no tiene la columna phone.
alter table public.profiles
add column if not exists phone text;


-- Fase 11F-C - Migracion segura para proyectos que ya ejecutaron el esquema antes
-- de agregar recuperacion de accesos, contacted_at/responded_at y status contacted.
alter table public.access_requests
add column if not exists contacted_at timestamptz;

alter table public.access_requests
add column if not exists responded_at timestamptz;

alter table public.account_access_recovery
add column if not exists updated_at timestamptz default now();

alter table public.account_access_recovery
add column if not exists restored_user_id uuid;

alter table public.access_requests
drop constraint if exists access_requests_status_check;

alter table public.access_requests
add constraint access_requests_status_check
check (status in ('pending', 'approved', 'rejected', 'contacted'));
