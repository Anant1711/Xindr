# Gym Buddy

A mobile-first PWA that helps people find a gym buddy nearby. Platonic, hyperlocal (Pimple Saudagar / Pimpri-Chinchwad, Pune), safety first. The full spec is in [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md).

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime, RLS) · zod · date-fns · Vitest · pgTAP.

## Status

| Phase | Scope                           | State       |
| ----- | ------------------------------- | ----------- |
| 0     | Scaffold, iOS component kit, CI | Done        |
| 1     | Database, RLS tests, dev seed   | Not started |
| 2     | Auth and onboarding             | Not started |
| 3     | Nearby and buddy profile        | Not started |
| 4     | Ask to Train and requests       | Not started |
| 5     | Chat                            | Not started |
| 6     | Safety and account              | Not started |
| 7     | PWA, polish, deploy             | Not started |

## Requirements

- Node.js 20.9+ (CI uses 22)
- pnpm (`npm install -g pnpm`)
- Docker Desktop, running (needed for the local Supabase stack from Phase 1)

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in values; see below
pnpm dev                     # http://localhost:3000
```

In development, the component kit is at <http://localhost:3000/dev/components> (returns 404 in production).

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

| Command          | What it does                        |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Dev server                          |
| `pnpm build`     | Production build                    |
| `pnpm typecheck` | `tsc --noEmit`                      |
| `pnpm lint`      | ESLint                              |
| `pnpm format`    | Prettier (write)                    |
| `pnpm test`      | Vitest unit tests                   |
| `pnpm db:test`   | pgTAP database tests (from Phase 1) |

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
