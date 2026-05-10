drop index if exists public.quiz_events_location_key_created_at_idx;

alter table public.quiz_events
  drop constraint if exists quiz_events_location_key_check,
  drop constraint if exists quiz_events_role_check,
  drop constraint if exists quiz_events_event_type_keys_check,
  drop constraint if exists quiz_events_answers_object_check,
  drop constraint if exists quiz_events_score_check;

alter table public.quiz_events
  drop column if exists location_key,
  drop column if exists role,
  drop column if exists event_type_keys,
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists score integer not null default 0;

alter table public.quiz_events
  alter column answers drop default,
  alter column score drop default;

alter table public.quiz_events
  add constraint quiz_events_answers_object_check check (
    jsonb_typeof(answers) = 'object'
  ),
  add constraint quiz_events_score_check check (
    score between 0 and 30
  );

comment on table public.quiz_events is
  'Anonymous aggregate quiz completions. Stores answer letters, score, and result band only.';
comment on column public.quiz_events.answers is
  'Anonymous A-D answer map keyed by quiz question. Does not store question text or user-provided content.';
comment on column public.quiz_events.score is
  'Quiz exposure score from 0 to 30.';

alter table public.quiz_events enable row level security;

revoke all on table public.quiz_events from anon, authenticated;
grant insert on table public.quiz_events to service_role;

create index if not exists quiz_events_score_created_at_idx
  on public.quiz_events (score, created_at desc);
