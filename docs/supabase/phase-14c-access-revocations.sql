

create table if not exists public.access_revocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  beat_id uuid not null references public.beats(id) on delete cascade,
  reason text not null,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists access_revocations_user_id_idx
  on public.access_revocations(user_id);

create index if not exists access_revocations_beat_id_idx
  on public.access_revocations(beat_id);

create index if not exists access_revocations_user_beat_idx
  on public.access_revocations(user_id, beat_id);

alter table public.access_revocations enable row level security;