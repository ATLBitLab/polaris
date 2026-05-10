alter table public.quiz_events
  add column if not exists role text;

update public.quiz_events
  set role = 'organizer'
  where role is null;

alter table public.quiz_events
  alter column role set not null,
  add constraint quiz_events_role_check check (role in ('participant', 'organizer'));

create index if not exists quiz_events_role_created_at_idx
  on public.quiz_events (role, created_at desc);

comment on column public.quiz_events.role is
  'Self-identified path through the quiz: participant or organizer.';
