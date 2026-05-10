-- Optional evidence uploads attached to an incident report.
--
-- Files (police reports, medical reports, photos) live in a private Supabase
-- Storage bucket. Metadata about each file lives in incident_evidence so the
-- app can list and delete files for the report owner. Both the table and the
-- bucket are restricted to the service role; the browser only ever talks to
-- our API routes.

create table public.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.incident_reports(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamp with time zone not null default now(),

  constraint incident_evidence_size_check check (
    size_bytes >= 0 and size_bytes <= 26214400
  )
);

comment on table public.incident_evidence is
  'Files uploaded by reporters as supporting evidence (police reports, medical reports, photos).';

alter table public.incident_evidence enable row level security;

revoke all on table public.incident_evidence from anon, authenticated;
grant select, insert, update, delete on table public.incident_evidence to service_role;

create index incident_evidence_report_id_created_at_idx
  on public.incident_evidence (report_id, created_at desc);

-- Private storage bucket for the evidence files. Service role does all reads
-- and writes; anon and authenticated have no direct access.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'incident-evidence',
  'incident-evidence',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "incident-evidence service role manage"
  on storage.objects;

create policy "incident-evidence service role manage"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'incident-evidence')
  with check (bucket_id = 'incident-evidence');
