begin;

-- Fase 15.2: expediente comercial separado de solicitudes, pagos y accesos.
create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  status text not null default 'open',
  source text not null default 'manual',
  beat_id uuid references public.beats(id) on delete set null,
  access_request_id uuid references public.access_requests(id) on delete set null,
  estimated_value numeric(12,2),
  currency text,
  summary text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  archived_at timestamptz,
  constraint crm_opportunities_profile_retention_check
    check (profile_id is not null or archived_at is not null),
  constraint crm_opportunities_title_check
    check (title = btrim(title) and char_length(title) between 3 and 160),
  constraint crm_opportunities_summary_check
    check (summary is null or char_length(summary) <= 2000),
  constraint crm_opportunities_status_check
    check (status in ('open', 'qualified', 'proposal', 'closed_won', 'closed_lost')),
  constraint crm_opportunities_source_check
    check (source in ('manual', 'access_request', 'commercial_activity', 'relationship', 'existing_customer', 'revocation', 'other')),
  constraint crm_opportunities_value_check
    check (
      (estimated_value is null and currency is null)
      or (
        estimated_value >= 0
        and currency is not null
        and currency = upper(currency)
        and currency ~ '^[A-Z]{3}$'
      )
    ),
  constraint crm_opportunities_closed_at_check
    check (
      (status in ('open', 'qualified', 'proposal') and closed_at is null)
      or (status in ('closed_won', 'closed_lost') and closed_at is not null)
    ),
  constraint crm_opportunities_request_source_check
    check (access_request_id is null or source = 'access_request')
);

create index if not exists crm_opportunities_profile_id_idx
on public.crm_opportunities (profile_id);

create index if not exists crm_opportunities_beat_id_idx
on public.crm_opportunities (beat_id)
where beat_id is not null;

create unique index if not exists crm_opportunities_access_request_id_key
on public.crm_opportunities (access_request_id)
where access_request_id is not null;

create index if not exists crm_opportunities_status_idx
on public.crm_opportunities (status);

create index if not exists crm_opportunities_source_idx
on public.crm_opportunities (source);

create index if not exists crm_opportunities_created_at_idx
on public.crm_opportunities (created_at desc);

create index if not exists crm_opportunities_active_updated_at_idx
on public.crm_opportunities (updated_at desc)
where archived_at is null;

create index if not exists crm_opportunities_created_by_idx
on public.crm_opportunities (created_by);

create index if not exists crm_opportunities_updated_by_idx
on public.crm_opportunities (updated_by);

create or replace function private.enforce_crm_opportunity_contract()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  transition_allowed boolean;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  if tg_op = 'INSERT' then
    if new.profile_id is null then
      raise exception using
        errcode = '23514',
        message = 'profile_id is required when creating an Opportunity';
    end if;

    if new.status <> 'open' or new.closed_at is not null or new.archived_at is not null then
      raise exception using
        errcode = '23514',
        message = 'new Opportunities must start open and active';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    transition_allowed := case old.status
      when 'open' then new.status in ('qualified', 'closed_lost')
      when 'qualified' then new.status in ('open', 'proposal', 'closed_lost')
      when 'proposal' then new.status in ('qualified', 'closed_won', 'closed_lost')
      when 'closed_won' then new.status = 'open'
      when 'closed_lost' then new.status = 'open'
      else false
    end;

    if not transition_allowed then
      raise exception using
        errcode = '23514',
        message = format('invalid Opportunity transition: %s -> %s', old.status, new.status);
    end if;
  end if;

  if new.status = 'closed_won'
    and new.profile_id is not null
    and (
      tg_op = 'INSERT'
      or old.status is distinct from new.status
      or old.profile_id is distinct from new.profile_id
      or old.beat_id is distinct from new.beat_id
    )
  then
    if new.beat_id is null or not exists (
      select 1
      from public.manual_payments payment
      where payment.user_id = new.profile_id
        and payment.beat_id = new.beat_id
    ) then
      raise exception using
        errcode = '23514',
        message = 'closed_won requires a confirmed manual payment for profile and beat';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_crm_opportunity_contract()
from public, anon, authenticated;

drop trigger if exists crm_opportunities_contract_trigger
on public.crm_opportunities;

create trigger crm_opportunities_contract_trigger
before insert or update on public.crm_opportunities
for each row execute function private.enforce_crm_opportunity_contract();

revoke all on table public.crm_opportunities from anon, authenticated;
grant select, insert, update on table public.crm_opportunities to authenticated;

alter table public.crm_opportunities enable row level security;

drop policy if exists "crm_opportunities_admin_select"
on public.crm_opportunities;
create policy "crm_opportunities_admin_select"
on public.crm_opportunities
for select
to authenticated
using ((select private.is_br_admin()));

drop policy if exists "crm_opportunities_admin_insert"
on public.crm_opportunities;
create policy "crm_opportunities_admin_insert"
on public.crm_opportunities
for insert
to authenticated
with check ((select private.is_br_admin()));

drop policy if exists "crm_opportunities_admin_update"
on public.crm_opportunities;
create policy "crm_opportunities_admin_update"
on public.crm_opportunities
for update
to authenticated
using ((select private.is_br_admin()))
with check ((select private.is_br_admin()));

commit;
