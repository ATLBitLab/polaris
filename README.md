# Polaris Safety Quiz

Polaris is a small Next.js App Router app for a privacy-preserving event safety quiz. The quiz collects only broad state or metro, role, and event type dimensions, calculates a calm planning band, and writes anonymous aggregate analytics to Supabase when server credentials are configured.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The first screen is the quiz.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Environment

Copy `.env.example` to `.env.local` for local work.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` is server-only and is used by `src/app/api/quiz-events/route.ts` to insert anonymous analytics. It must never use a `NEXT_PUBLIC_` prefix. If your Supabase project still uses a service role key instead of a secret key, `SUPABASE_SERVICE_ROLE_KEY` is supported as a fallback.

The public publishable key is documented for Vercel and future client-side Supabase use, but the current quiz does not send Supabase credentials to the browser.

## Supabase

Schema changes live in `supabase/migrations`. The analytics table is `public.quiz_events` and stores only:

- broad `location_key`
- `role`
- selected `event_type_keys`
- `risk_band`
- `created_at`

It does not store names, contact info, street addresses, exact coordinates, user accounts, or IP addresses. RLS is enabled and no browser-facing insert policy is defined, so writes are performed only by the server route with a server-side credential.

The Supabase CLI is available in this workspace (`supabase --version` reported `2.98.2` on May 9, 2026). Local migration verification passed with:

```bash
supabase db start
supabase migration list --local
supabase db lint --local --schema public
supabase db advisors --local --level warn --fail-on error
```

Supabase project linking and remote branch verification still require the user to authenticate the CLI against the target Supabase account.

## Supabase Branching And Vercel

Supabase preview branches are isolated environments with separate credentials. Use migrations in this repo so Git-based preview branches can apply schema changes consistently.

When the Supabase GitHub and Vercel integrations are connected, preview branch environment variables can be synced to Vercel preview deployments. Confirm the preview deployment is using the matching branch credentials before testing analytics writes.

Reference docs:

- https://supabase.com/docs/guides/deployment/branching
- https://supabase.com/docs/guides/deployment/branching/working-with-branches
- https://supabase.com/docs/guides/deployment/branching/integrations

## Quiz Rules

The scoring surface is intentionally centralized:

- `src/lib/quiz-config.ts` contains location buckets, role weights, event type weights, thresholds, and guidance metadata.
- `src/lib/quiz-engine.ts` validates inputs, calculates the risk band, builds the rationale, and returns prioritized guidance groups.
- `src/lib/quiz-engine.test.ts` covers the MVP scoring paths and threshold boundaries.
