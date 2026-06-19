-- B.R Fase 13F - playback_visibility
-- Ejecutar manualmente en Supabase Dashboard > SQL Editor.

alter table public.beats
add column if not exists playback_visibility text not null default 'private';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'beats_playback_visibility_check'
      and conrelid = 'public.beats'::regclass
  ) then
    alter table public.beats
    add constraint beats_playback_visibility_check
    check (playback_visibility in ('private', 'public'));
  end if;
end $$;

create index if not exists beats_playback_visibility_idx on public.beats (playback_visibility);
