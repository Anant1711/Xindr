# Gym Buddy

A mobile-first PWA that helps people find a gym buddy nearby. Platonic, hyperlocal (Pimple Saudagar / Pimpri-Chinchwad, Pune), safety first. The full spec is in [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md).

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime, RLS) · zod · date-fns · Vitest · pgTAP.

## Status

| Phase | Scope                           | State       |
| ----- | ------------------------------- | ----------- |
| 0     | Scaffold, iOS component kit, CI | Done        |
| 1     | Database, RLS tests, dev seed   | Done        |
| 2     | Auth and onboarding             | Not started |
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
lib/                  constants and pure helpers
supabase/             Supabase CLI config, migrations, pgTAP tests
docs/BUILD_SPEC.md    the spec
```

## Notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts`; session refresh will live there.
- Supabase free projects pause after about a week of inactivity. Keep traffic or upgrade before a real launch.
