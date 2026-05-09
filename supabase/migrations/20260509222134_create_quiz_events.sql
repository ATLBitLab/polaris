create extension if not exists pgcrypto with schema extensions;

create table public.quiz_events (
  id uuid primary key default gen_random_uuid(),
  location_key text not null,
  role text not null,
  event_type_keys text[] not null,
  risk_band text not null,
  created_at timestamp with time zone not null default now(),
  constraint quiz_events_location_key_check check (
    location_key in (
      'metro_atlanta',
      'dc_metro',
      'new_york_metro',
      'los_angeles_metro',
      'sf_bay_area',
      'chicago_metro',
      'alabama',
      'alaska',
      'arizona',
      'arkansas',
      'california',
      'colorado',
      'connecticut',
      'delaware',
      'district_of_columbia',
      'florida',
      'georgia',
      'hawaii',
      'idaho',
      'illinois',
      'indiana',
      'iowa',
      'kansas',
      'kentucky',
      'louisiana',
      'maine',
      'maryland',
      'massachusetts',
      'michigan',
      'minnesota',
      'mississippi',
      'missouri',
      'montana',
      'nebraska',
      'nevada',
      'new_hampshire',
      'new_jersey',
      'new_mexico',
      'new_york',
      'north_carolina',
      'north_dakota',
      'ohio',
      'oklahoma',
      'oregon',
      'pennsylvania',
      'rhode_island',
      'south_carolina',
      'south_dakota',
      'tennessee',
      'texas',
      'utah',
      'vermont',
      'virginia',
      'washington_state',
      'west_virginia',
      'wisconsin',
      'wyoming',
      'other_us'
    )
  ),
  constraint quiz_events_role_check check (
    role in ('community_member', 'organizer')
  ),
  constraint quiz_events_event_type_keys_check check (
    array_length(event_type_keys, 1) is not null
    and event_type_keys <@ array[
      'low_key_social',
      'picnic',
      'protest',
      'international_political_work'
    ]::text[]
  ),
  constraint quiz_events_risk_band_check check (
    risk_band in ('lower', 'moderate', 'elevated')
  )
);

comment on table public.quiz_events is
  'Anonymous aggregate quiz completions. Stores broad dimensions and result band only.';
comment on column public.quiz_events.location_key is
  'Broad state or metro bucket, never an address or exact coordinate.';
comment on column public.quiz_events.event_type_keys is
  'Selected event type keys from the quiz config.';

alter table public.quiz_events enable row level security;

revoke all on table public.quiz_events from anon, authenticated;
grant insert on table public.quiz_events to service_role;

create index quiz_events_created_at_idx
  on public.quiz_events (created_at desc);

create index quiz_events_risk_band_created_at_idx
  on public.quiz_events (risk_band, created_at desc);

create index quiz_events_location_key_created_at_idx
  on public.quiz_events (location_key, created_at desc);
