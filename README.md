# B.R

Plataforma privada de beats con previews, player real, permisos demo y Supabase Auth.

## Variables de entorno

Crear `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://TU_PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="TU_ANON_KEY"
NEXT_PUBLIC_BRCEO_EMAIL="admin@br.local"
```

`NEXT_PUBLIC_BRCEO_EMAIL` define al único admin visual. Si el usuario autenticado tiene ese email, ve `/admin`.

## Auth

- `/login` usa `supabase.auth.signInWithPassword`.
- `/register` usa `supabase.auth.signUp`.
- `Cerrar sesión` usa `supabase.auth.signOut`.
- La sesión se restaura con `supabase.auth.getSession` y `onAuthStateChange`.

## SQL básico para profiles

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text unique,
  email text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
```

Por ahora B.R mantiene beats, permisos y accesos en datos demo locales. No hay pagos, storage ni accesos persistentes todavía.

## Desarrollo

```bash
npm run dev
npm run lint
```
