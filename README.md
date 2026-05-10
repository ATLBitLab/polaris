# Polaris Safety Quiz

Polaris is a small Next.js App Router app for a privacy-preserving event safety quiz. The quiz collects only A-D answer keys for ten safety exposure questions, calculates a calm planning band, and writes anonymous aggregate analytics to Supabase when server credentials are configured.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The first screen offers incident reporting and the safety quiz.

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
BLINDING_JOB_SECRET=
CRON_SECRET=
TINFOIL_API_KEY=
TINFOIL_ANALYSIS_MODEL=
TINFOIL_BLINDING_MODEL=
```

`SUPABASE_SECRET_KEY` is server-only and is used by `src/app/api/quiz-events/route.ts` to insert anonymous analytics. It must never use a `NEXT_PUBLIC_` prefix. If your Supabase project still uses a service role key instead of a secret key, `SUPABASE_SERVICE_ROLE_KEY` is supported as a fallback.

The public publishable key is also used by Supabase Auth SSR for the private research surface. The server-only Supabase key is still required for writes, overview aggregation, blinding jobs, and private dashboard data loading.

`BLINDING_JOB_SECRET` protects `POST /api/jobs/blind-incidents` with `Authorization: Bearer <secret>`. The endpoint accepts an optional JSON body such as `{"limit":5}` and returns counts for `processed`, `skipped`, and `failed`.

`CRON_SECRET` protects the Vercel Cron `GET /api/jobs/blind-incidents` invocation and can be set to the same value as `BLINDING_JOB_SECRET`. `vercel.json` runs this catch-up job once daily against the production deployment. Preview deployments still rely on the report-submission trigger or manual POST calls.

`TINFOIL_API_KEY` enables voice transcription, incident analysis, and private research blinding. `TINFOIL_BLINDING_MODEL` can override the default blinding model; otherwise the app falls back to `TINFOIL_ANALYSIS_MODEL` and then the built-in default.

## Supabase

Schema changes live in `supabase/migrations`. The analytics table is `public.quiz_events` and stores only:

- `answers`, a JSON object of A-D answer keys keyed by quiz question
- `score`, an integer from 0 to 30
- `risk_band`
- `created_at`

It does not store names, contact info, street addresses, exact coordinates, user accounts, free text, or IP addresses. RLS is enabled and no browser-facing insert policy is defined, so writes are performed only by the server route with a server-side credential.

The private research dashboard uses Supabase Auth magic links. Pre-create approved researchers in Supabase Auth; the app requests magic links with `shouldCreateUser: false`, so unknown email addresses are not enrolled by the app. Configure Supabase Auth URL settings to allow the app origin plus `/auth/callback` for local, preview, and production deployments.

Email delivery for magic links should be configured in Supabase Auth custom SMTP. For Mailgun, use Mailgun's SMTP host, port, username, password, sender address, and sender name in the Supabase Dashboard. The app does not call the Mailgun API directly.

Researcher access is explicit per report via `partner_sharing_consent`. Existing reports default to not shared. Authenticated researchers only see rows from `incident_report_blindings` where the raw report still has consent and the blinding status is `completed`; raw narratives, exact locations, people rows, and contact methods are not rendered in the Research Dashboard. Shared reports start a non-blocking blinding request when the reporter reaches `/report/done`; the protected batch job remains the fallback for retries and stale records.

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

- `src/lib/quiz-config.ts` contains the ten quiz questions, A-D answer scores, thresholds, and guidance metadata.
- `src/lib/quiz-engine.ts` validates inputs, calculates the risk band, builds the rationale, and returns prioritized guidance groups.
- `src/lib/quiz-engine.test.ts` covers score boundaries, input validation, and guidance groups.
