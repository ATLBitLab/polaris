alter table public.incident_reports
  add column partner_sharing_consent boolean not null default false,
  add column partner_sharing_decided_at timestamp with time zone,
  add column partner_sharing_consented_at timestamp with time zone,
  add constraint incident_reports_partner_sharing_consented_at_check check (
    (
      partner_sharing_consent = true
      and partner_sharing_consented_at is not null
    )
    or (
      partner_sharing_consent = false
      and partner_sharing_consented_at is null
    )
  );

comment on column public.incident_reports.partner_sharing_consent is
  'Explicit consent for authenticated researcher access to a blinded version of this incident. Existing and undecided reports default to false.';

create table public.incident_report_blindings (
  report_id uuid primary key references public.incident_reports(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  processing_started_at timestamp with time zone,
  completed_at timestamp with time zone,
  failed_at timestamp with time zone,

  status text not null default 'pending',
  source_fingerprint text not null,

  model_provider text not null default 'tinfoil',
  model text not null default '',
  model_metadata jsonb not null default '{}'::jsonb,

  blinded_narrative text not null default '',
  blinded_transcript text not null default '',
  blinded_people jsonb not null default '[]'::jsonb,
  blinded_location_label text not null default '',
  blinded_search_text text not null default '',

  incident_time_kind text not null default 'unknown',
  incident_occurred_at timestamp with time zone,
  coarse_region text not null default '',
  danger_level text not null default 'unknown',
  evidence_present boolean,
  physical_confrontation boolean,

  last_error text,

  constraint incident_report_blindings_status_check check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  constraint incident_report_blindings_time_kind_check check (
    incident_time_kind in (
      'unknown',
      'just_now',
      'an_hour_ago',
      'yesterday',
      'manual'
    )
  ),
  constraint incident_report_blindings_people_check check (
    jsonb_typeof(blinded_people) = 'array'
  )
);

comment on table public.incident_report_blindings is
  'One blinded research-facing incident record per raw report. Raw contact details and exact identifiers stay in incident_reports and incident_people.';
comment on column public.incident_report_blindings.source_fingerprint is
  'Hash of the raw shareable fields used for blinding. Contact methods are excluded.';
comment on column public.incident_report_blindings.blinded_search_text is
  'Server-generated search text from blinded fields only; no raw report or contact data.';

alter table public.incident_report_blindings enable row level security;

revoke all on table public.incident_report_blindings from anon, authenticated;
grant select, insert, update, delete on table public.incident_report_blindings to service_role;

create index incident_reports_partner_sharing_idx
  on public.incident_reports (partner_sharing_consent, updated_at desc);

create index incident_report_blindings_status_idx
  on public.incident_report_blindings (status, updated_at desc);

create index incident_report_blindings_filters_idx
  on public.incident_report_blindings (
    incident_occurred_at desc,
    danger_level,
    evidence_present,
    physical_confrontation
  )
  where status = 'completed';
