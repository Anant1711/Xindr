# Gym Buddy

A mobile-first PWA that helps people find a gym buddy nearby. Platonic, hyperlocal (Pimple Saudagar / Pimpri-Chinchwad, Pune), safety first. The full spec is in [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md).

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime, RLS) · zod · date-fns · Vitest · pgTAP.

## Status

| Phase | Scope                           | State       |
| ----- | ------------------------------- | ----------- |
| 0     | Scaffold, iOS component kit, CI | Done        |
| 1     | Database, RLS tests, dev seed   | Done        |
| 2     | Auth and onboarding             | Done        |
| 3     | Nearby and buddy profile        | Not started |
| 4     | Ask to Train and requests       | Not started |
| 5     | Chat                            | Not started |
| 6     | Safety and account              | Not started |
| 7     | PWA, polish, deploy             | Not started |

## Requirements

- Node.js 20.9+ (CI uses 22)
- pnpm (`npm install -g pnpm`)
- Docker Desktop, running (the local Supabase stack runs in Docker)

## Setup

```bash
pnpm install
pnpm db:start                # local Supabase; first run pulls images, applies migrations
pnpm exec supabase status    # shows API URL, anon key, service role key
cp .env.example .env.local   # paste the values from `supabase status`
ALLOW_DEV_SEED=true pnpm db:seed   # optional: 12 demo users
pnpm dev                     # http://localhost:3000
```

Local services: Studio <http://127.0.0.1:54323>, Mailpit (catches sign-in codes) <http://127.0.0.1:54324>.

In development, the component kit is at <http://localhost:3000/dev/components> (returns 404 in production).

## Database

- Schema: `supabase/migrations/0001_init.sql` (applied verbatim from the spec). Change it only by adding a new migration.
- Tests: `pnpm db:test` runs the pgTAP suite in `supabase/tests/` (visibility, RLS, RPC rules, messaging, blocking).
- Types: after a schema change run `pnpm db:types` to regenerate `lib/database.types.ts`.
- Reset: `pnpm db:reset` re-applies migrations to an empty local database (re-run the seed after).
- Seed: `scripts/seed-dev.ts` refuses to run unless `ALLOW_DEV_SEED=true` **and** the Supabase URL is local or listed in `DEV_PROJECT_REFS` inside the script. Never add the production project. Demo users (`demo+<name>@example.com`) sign in with the email code; locally the code appears in Mailpit.

## Auth

Sign-in is Google or a 6-digit email code (`signInWithOtp` then `verifyOtp` with type `email`). No passwords.

- **Email template:** the email must show the code, so the template must contain `{{ .Token }}`. Locally this is configured in `supabase/config.toml` using `supabase/templates/code.html` (for both the Magic Link and Confirm signup templates). On the hosted project, paste the same HTML into Auth > Email Templates for **Magic Link** and **Confirm signup**.
- **Google:** create OAuth credentials in Google Cloud (authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`, or `http://127.0.0.1:54321/auth/v1/callback` locally), then enable the provider in the dashboard. To use it locally, set `enabled = true` under `[auth.external.google]` in `supabase/config.toml` and export `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` before `supabase start`. While Google is disabled, the button shows a calm "not available yet" message.
- **Redirect URLs:** add `http://localhost:3000/auth/callback` and the Vercel `/auth/callback` URL.
- **Routing:** `proxy.ts` refreshes the session and sends signed-out visitors to `/login`. No profile yet → `/onboarding`; otherwise the app. Sign out is in the Profile tab (and on the first onboarding step).

## Environment variables

| Variable                        | Where           | Notes                                                 |
| ------------------------------- | --------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server |                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public key, safe with RLS                             |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only** | Used only by account deletion and the dev seed script |
| `NEXT_PUBLIC_APP_URL`           | client + server | For share links                                       |
| `ALLOW_DEV_SEED`                | local only      | Must be `true` to run the seed script                 |

Never commit `.env.local`. Never give the service-role key a `NEXT_PUBLIC_` prefix.

## Scripts

| Command          | What it does         |
| ---------------- | -------------------- |
| `pnpm dev`       | Dev server           |
| `pnpm build`     | Production build     |
| `pnpm typecheck` | `tsc --noEmit`       |
| `pnpm lint`      | ESLint               |
| `pnpm format`    | Prettier (write)     |
| `pnpm test`      | Vitest unit tests    |
| `pnpm db:test`   | pgTAP database tests |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, format check and unit tests on every push and PR.

## Project layout

```
app/                  routes (App Router)
app/dev/components/   dev-only component showcase
components/ios/       iOS-style component kit (no third-party UI kit)
components/profile/   profile fields shared by onboarding and the Profile tab
lib/                  constants, validation, auth helpers, Supabase clients
proxy.ts              session refresh + signed-out redirect
supabase/             Supabase CLI config, migrations, pgTAP tests
docs/BUILD_SPEC.md    the spec
```

## Notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts`; session refresh lives there (`lib/supabase/middleware.ts` holds the logic).
- Supabase free projects pause after about a week of inactivity. Keep traffic or upgrade before a real launch.
