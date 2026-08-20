-- Fase 15.1: relaciones comerciales explícitas sobre profiles.id.
-- No representa pagos, accesos, solicitudes ni actividad histórica.

create table if not exists public.crm_relationships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint crm_relationships_type_check
    check (relationship_type in ('lead', 'client', 'artist', 'producer', 'collaborator')),
  constraint crm_relationships_profile_type_key
    unique (profile_id, relationship_type)
);

revoke all on table public.crm_relationships from anon;
grant select, insert, update on table public.crm_relationships to authenticated;

alter table public.crm_relationships enable row level security;

create policy "crm_relationships_admin_select"
on public.crm_relationships
for select
to authenticated
using ((select private.is_br_admin()));

create policy "crm_relationships_admin_insert"
on public.crm_relationships
for insert
to authenticated
with check ((select private.is_br_admin()));

create policy "crm_relationships_admin_update"
on public.crm_relationships
for update
to authenticated
using ((select private.is_br_admin()))
with check ((select private.is_br_admin()));
