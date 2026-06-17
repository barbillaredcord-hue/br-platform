-- B.R Fase 13 - Preview Editor funcional
-- Ejecutar manualmente en Supabase Dashboard > SQL Editor.
-- Permite guardar previews reales de 15 a 30 segundos.

alter table public.beats
add column if not exists preview_duration_seconds integer not null default 15;

alter table public.beats
add column if not exists preview_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'beats_preview_duration_seconds_check'
      and conrelid = 'public.beats'::regclass
  ) then
    alter table public.beats
    add constraint beats_preview_duration_seconds_check
    check (preview_duration_seconds between 15 and 30);
  end if;
end $$;

create index if not exists beats_preview_duration_seconds_idx
on public.beats (preview_duration_seconds);
