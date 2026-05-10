create table public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_autosaved_at timestamp with time zone,
  autosave_version integer not null default 0,

  incident_time_kind text not null default 'unknown',
  incident_occurred_at timestamp with time zone,
  incident_time_note text not null default '',

  location_source text not null default 'unknown',
  location_label text not null default '',
  location_latitude double precision,
  location_longitude double precision,
  location_accuracy_meters double precision,

  narrative_text text not null default '',
  transcript_text text not null default '',
  transcript_model text,
  transcript_language text,
  transcript_updated_at timestamp with time zone,

  quality_score integer not null default 0,
  quality_feedback jsonb not null default '[]'::jsonb,
  checklist_state jsonb not null default '[]'::jsonb,
  analysis_metadata jsonb not null default '{}'::jsonb,

  contact_consent boolean not null default false,
  contact_decided_at timestamp with time zone,
  contact_consented_at timestamp with time zone,
  contact_methods jsonb not null default '[]'::jsonb,

  device_source_hash text not null,

  constraint incident_reports_time_kind_check check (
    incident_time_kind in (
      'unknown',
      'just_now',
      'an_hour_ago',
      'yesterday',
      'manual'
    )
  ),
  constraint incident_reports_location_source_check check (
    location_source in ('unknown', 'browser', 'manual')
  ),
  constraint incident_reports_latitude_check check (
    location_latitude is null
    or (location_latitude >= -90 and location_latitude <= 90)
  ),
  constraint incident_reports_longitude_check check (
    location_longitude is null
    or (location_longitude >= -180 and location_longitude <= 180)
  ),
  constraint incident_reports_coordinate_pair_check check (
    (location_latitude is null and location_longitude is null)
    or (location_latitude is not null and location_longitude is not null)
  ),
  constraint incident_reports_accuracy_check check (
    location_accuracy_meters is null
    or (
      location_accuracy_meters >= 0
      and location_accuracy_meters <= 100000
    )
  ),
  constraint incident_reports_quality_score_check check (
    quality_score >= 0 and quality_score <= 100
  ),
  constraint incident_reports_contact_consented_at_check check (
    (contact_consent = true and contact_consented_at is not null)
    or (contact_consent = false and contact_consented_at is null)
  )
);

create table public.incident_people (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.incident_reports(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  source text not null default 'user',
  display_name text not null default '',
  role text not null default '',
  description text not null default '',
  confidence numeric(5, 4),
  sort_order integer not null default 0,

  constraint incident_people_source_check check (source in ('ai', 'user')),
  constraint incident_people_confidence_check check (
    confidence is null or (confidence >= 0 and confidence <= 1)
  )
);

comment on table public.incident_reports is
  'Public no-login incident reports. Browser writes are blocked; server routes write with service credentials.';
comment on column public.incident_reports.contact_methods is
  'Flexible consent-based contact methods such as email, phone, Signal, WhatsApp, or future organization channels.';
comment on column public.incident_reports.device_source_hash is
  'Hash of a browser-held anonymous continuity token. The raw token is never stored.';
comment on table public.incident_people is
  'Editable people extracted from or added to a public incident report.';

alter table public.incident_reports enable row level security;
alter table public.incident_people enable row level security;

revoke all on table public.incident_reports from anon, authenticated;
revoke all on table public.incident_people from anon, authenticated;

grant select, insert, update, delete on table public.incident_reports to service_role;
grant select, insert, update, delete on table public.incident_people to service_role;

create index incident_reports_created_at_idx
  on public.incident_reports (created_at desc);

create index incident_reports_device_source_hash_idx
  on public.incident_reports (device_source_hash);

create index incident_reports_last_autosaved_at_idx
  on public.incident_reports (last_autosaved_at desc);

create index incident_people_report_id_sort_order_idx
  on public.incident_people (report_id, sort_order);
