create extension if not exists btree_gist;  -- needed for the no-overlap rule

-- ============ LOOKUP TABLES (archived, never deleted) ============

create table pre_bed_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  examples text,
  archived boolean not null default false,
  unique (user_id, name)
);

create table sleep_aids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  archived boolean not null default false,
  unique (user_id, name)
);

create table event_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  duration_mode text not null default 'ended_button'
    check (duration_mode in ('none', 'ended_button', 'duration_chips')),
  archived boolean not null default false,
  unique (user_id, name)
);

create table substances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  unit text not null check (unit in ('mg', 'standard_drinks')),
  archived boolean not null default false,
  unique (user_id, name)
);

create table consumption_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  substance_id uuid not null references substances(id),
  name text not null,
  default_amount numeric not null check (default_amount >= 0),  -- mg, or standard drinks
  volume_ml numeric check (volume_ml > 0),                      -- optional, alcohol
  abv_percent numeric check (abv_percent >= 0 and abv_percent <= 100),
  is_favorite boolean not null default false,
  archived boolean not null default false,
  unique (user_id, name),
  check ((volume_ml is null) = (abv_percent is null))
);

-- When volume and ABV are both set, default_amount is computed:
-- ml x ABV x 0.789 g/ml ethanol / 14 g per US standard drink
create function set_item_amount() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.volume_ml is not null and new.abv_percent is not null then
    new.default_amount := round(new.volume_ml * new.abv_percent / 100 * 0.789 / 14, 2);
  end if;
  return new;
end $$;

create trigger consumption_items_amount
  before insert or update on consumption_items
  for each row execute function set_item_amount();

-- ============ SLEEP ============
-- All times are wall-clock (timestamp WITHOUT time zone). Client supplies them.

create table sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('night', 'nap')),
  night_of date,
  sleep_start timestamp not null,
  woke_up timestamp,                       -- null while the session is open
  duration interval generated always as (woke_up - sleep_start) stored,
  pre_bed_activity_id uuid references pre_bed_activities(id),
  sleep_aid_id uuid references sleep_aids(id),
  notes text,
  check (woke_up is null or woke_up > sleep_start),
  check ((kind = 'night') = (night_of is not null)),
  unique (user_id, night_of),
  -- no two sessions may overlap (an open session extends forever)
  exclude using gist (user_id with =, tsrange(sleep_start, woke_up) with &&)
);

-- only one open session at a time
create unique index one_open_session on sleep_sessions (user_id) where woke_up is null;

-- "Night of" = the evening's date: a 2am start belongs to the previous day
create function set_night_of() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.kind = 'night' and new.night_of is null then
    new.night_of := (new.sleep_start - interval '12 hours')::date;
  end if;
  return new;
end $$;

create trigger sleep_sessions_night_of
  before insert or update on sleep_sessions
  for each row execute function set_night_of();

-- ============ INCIDENTS ============

create table incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  occurred_at timestamp not null,
  event_type_id uuid not null references event_types(id),
  end_status text not null default 'pending'
    check (end_status in ('pending', 'ended', 'unknown')),
  ended_at timestamp,
  notes text,
  check ((end_status = 'ended') = (ended_at is not null)),
  check (ended_at is null or ended_at >= occurred_at)
);

-- ============ CONSUMPTION ============

create table consumption_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  item_id uuid not null references consumption_items(id),
  quantity numeric not null default 1 check (quantity > 0),   -- fractions allowed (0.25, 0.5)
  amount numeric not null check (amount >= 0),                -- snapshot: quantity x item default, editable
  consumed_at timestamp not null,
  incident_id uuid references incidents(id) on delete set null,
  notes text
);

create index on sleep_sessions (user_id, sleep_start desc);
create index on incidents (user_id, occurred_at desc);
create index on consumption_entries (user_id, consumed_at desc);

-- ============ SECURITY (RLS) ============

do $$
declare t text;
begin
  foreach t in array array[
    'pre_bed_activities','sleep_aids','event_types','substances',
    'consumption_items','sleep_sessions','incidents','consumption_entries'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "own rows" on %I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- ============ DERIVED VIEWS (security_invoker so RLS still applies) ============

-- Each incident with its related night and phase.
-- Thresholds (3h after waking, 2h before sleep) are easy to change.
create view incidents_enriched with (security_invoker = true) as
select
  i.*,
  et.name as event_type,
  s.id as session_id,
  s.night_of,
  case
    when s.id is null then null
    when s.woke_up is null or i.occurred_at < s.woke_up then 'during_sleep'
    when i.occurred_at < s.woke_up + interval '3 hours' then 'waking_up'
    when nxt.sleep_start is not null
         and i.occurred_at >= nxt.sleep_start - interval '2 hours' then 'going_to_sleep'
    else 'daytime'
  end as phase
from incidents i
join event_types et on et.id = i.event_type_id
left join lateral (
  select * from sleep_sessions s
  where s.user_id = i.user_id and s.kind = 'night' and s.sleep_start <= i.occurred_at
  order by s.sleep_start desc limit 1
) s on true
left join lateral (
  select n.sleep_start from sleep_sessions n
  where n.user_id = i.user_id and n.kind = 'night' and n.sleep_start > i.occurred_at
  order by n.sleep_start limit 1
) nxt on true;

-- Per night and substance: amount in the 12h before bed, and time since the last dose.
create view night_consumption with (security_invoker = true) as
select
  s.id as session_id,
  s.night_of,
  sub.name as substance,
  sum(e.amount) as amount_prior_12h,
  min(s.sleep_start - e.consumed_at) as time_since_last
from sleep_sessions s
join consumption_entries e
  on e.user_id = s.user_id
 and e.consumed_at <= s.sleep_start
 and e.consumed_at > s.sleep_start - interval '12 hours'
join consumption_items ci on ci.id = e.item_id
join substances sub on sub.id = ci.substance_id
where s.kind = 'night'
group by s.id, s.night_of, sub.name;