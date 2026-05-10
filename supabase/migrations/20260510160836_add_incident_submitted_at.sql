alter table public.incident_reports
  add column submitted_at timestamp with time zone;

create index incident_reports_submitted_at_idx
  on public.incident_reports (submitted_at desc)
  where submitted_at is not null;

comment on column public.incident_reports.submitted_at is
  'Timestamp set when the user reaches /report/done. Once non-null, the report is locked from further PATCH edits.';
