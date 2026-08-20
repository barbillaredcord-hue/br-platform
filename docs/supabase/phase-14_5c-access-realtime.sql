-- B.R Fase 14.5C - señal privada Realtime para cambios de beat_access.
-- Reversible: eliminar trigger, función y policy con los nombres definidos abajo.

drop policy if exists "Users receive own beat access changes" on realtime.messages;
create policy "Users receive own beat access changes"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) = 'br-access:' || (select auth.uid())::text
);

create or replace function private.broadcast_beat_access_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'br-access:' || coalesce(new.user_id, old.user_id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );

  return null;
end;
$$;

revoke all on function private.broadcast_beat_access_change() from public;
revoke all on function private.broadcast_beat_access_change() from anon;
revoke all on function private.broadcast_beat_access_change() from authenticated;

drop trigger if exists beat_access_realtime_changes on public.beat_access;
create trigger beat_access_realtime_changes
after insert or update or delete on public.beat_access
for each row
execute function private.broadcast_beat_access_change();
