# Gym Buddy

A mobile-first PWA that helps people find a gym buddy nearby. Platonic, hyperlocal (Pimple Saudagar / Pimpri-Chinchwad, Pune), safety first. The full spec is in [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md).

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime, RLS) · zod · date-fns · Vitest · pgTAP.

## Status

| Phase | Scope                           | State                     |
| ----- | ------------------------------- | ------------------------- |
| 0     | Scaffold, iOS component kit, CI | Done                      |
| 1     | Database, RLS tests, dev seed   | Done                      |
| 2     | Auth and onboarding             | Done                      |
| 3     | Nearby and buddy profile        | Done                      |
| 4     | Ask to Train and requests       | Done                      |
| 5     | Chat                            | Done                      |
| 6     | Safety and account              | Done                      |
| 7     | PWA, polish, deploy             | Done (deploy steps below) |

## Design

The UI follows the "Gym Buddy App – iOS UI" design canvas: white surfaces, indigo accent `#3652FF`, Archivo Black display type over Inter body, pill chips and buttons, bordered cards. Tokens live in `app/globals.css` (`@theme`); fonts are self-hosted with `next/font`. Where the canvas and the spec differ, the spec wins: no fake status bar, an explicit 18+ checkbox, a darker overlap green for contrast, and no filter button without a feature behind it.

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
- `0002_blocked_people.sql` adds `my_blocked_people()`, so the Profile tab can list people you blocked (RLS hides a blocked person's profile row by design). The spec's optional Phase 8 migration becomes `0003_checkins.sql`.
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
app/                  routes (App Router), manifest.ts, icons
app/dev/components/   dev-only component showcase
components/ios/       iOS-style component kit (no third-party UI kit)
components/profile/   profile fields shared by onboarding and the Profile tab
lib/                  constants, validation, auth helpers, Supabase clients
proxy.ts              session refresh + signed-out redirect
supabase/             Supabase CLI config, migrations, pgTAP tests
docs/BUILD_SPEC.md    the spec
```

## Security

- RLS on every table; discovery only through `nearby_profiles()` / `get_buddy_profile()`.
- The service-role key is used only in `app/api/account/delete/route.ts` and `scripts/seed-dev.ts`.
- `next.config.ts` sets a Content-Security-Policy (allows only this app plus the Supabase URL and its websocket), `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- Message and note text is always rendered as plain text (lint forbids `dangerouslySetInnerHTML`).
- Deleting an account removes the auth user; everything cascades. Reports and feedback the person filed are kept without the link to them (schema: `on delete set null`).

## Manual QA checklist

Run with two browsers (one normal, one private) signed in as different users. Locally, read sign-in codes in Mailpit.

1. Sign up as A (woman) and B (man): email code, onboarding, land on Nearby. Sign out and back in: onboarding is skipped.
2. A turns on "Only women can see me": B no longer sees A in Nearby, and A's profile URL shows "Not available" for B.
3. B filters Nearby by level; opens a profile; overlap pills match shared days at the same time of day.
4. A asks B to train: B's Chats badge and NEW REQUEST appear without refreshing. Decline: A's WAITING row disappears live. Ask again, accept: both see the chat.
5. Chat both ways in real time; check read state, day separators, plan card. Turn the network off and send: "Not sent. Tap to retry", then retry.
6. End the conversation from one side: the other side becomes read-only ("This conversation has ended.").
7. Report from a profile and from a chat; block from a profile: you return to Nearby and neither sees the other. Unblock from Profile > Blocked people.
8. Pause in Profile: you disappear from the other person's Nearby, and your Nearby shows the paused message. Unpause.
9. Edit My details and Preferences; switch gender to Man and confirm "Only women can see me" turns off.
10. Send feedback; "My area isn't listed" during onboarding.
11. Delete account: confirm, land on login with the confirmation; check in Supabase Studio that the user's rows are gone.
12. Repeat the core flow on a real iPhone in Safari and as an installed PWA (Phase 7).

## Deploy (Supabase + Vercel)

Never paste secret keys into chat, issues or commits. They go only into the Supabase and Vercel dashboards (and your local `.env.local`).

### 1. Supabase project

1. Create a project at supabase.com (region close to India, e.g. Mumbai). Keep the **database password** somewhere safe.
2. In a terminal in this repo:
   ```bash
   pnpm exec supabase login                          # opens the browser once
   pnpm exec supabase link --project-ref <your-ref>  # asks for the database password
   pnpm exec supabase db push                        # applies supabase/migrations/*
   ```
   `<your-ref>` is the part of the project URL before `.supabase.co`.
3. Dashboard > **Authentication > URL Configuration**: Site URL = your Vercel URL (e.g. `https://xindr.vercel.app`). Redirect URLs: `https://<your-vercel-domain>/auth/callback` and `http://localhost:3000/auth/callback`.
4. Dashboard > **Authentication > Emails > Templates**: paste `supabase/templates/code.html` into **Magic Link** and **Confirm signup** (subject: "Your Gym Buddy sign-in code"). The template must contain `{{ .Token }}`.
5. Email sending: the built-in sender allows only a few emails per hour. Before inviting real users, set **Authentication > Emails > SMTP** to Resend or Brevo. Until then, prefer Google sign-in for testers.
6. Data: add real gyms in **Table Editor > gyms** (never invented names) and check the coordinates in **areas** on a map.
7. Optional but recommended: **Database > Extensions** enable `pg_cron`, then in the SQL editor:
   ```sql
   select cron.schedule('expire-requests', '*/30 * * * *', 'select public.expire_stale_requests()');
   ```

### 2. Google sign-in

1. Google Cloud Console > APIs & Services > Credentials > **Create OAuth client ID** (Web application).
2. Authorised redirect URI: `https://<your-ref>.supabase.co/auth/v1/callback`.
3. Supabase dashboard > **Authentication > Sign In / Providers > Google**: enable, paste the **Client ID** and **Client secret**, save. Nothing goes into this repo.
4. Locally (optional): put `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in `supabase/.env` (gitignored), set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`, and add `http://127.0.0.1:54321/auth/v1/callback` to the Google client.

### 3. Vercel

1. vercel.com > **Add New > Project** > import the GitHub repo `Anant1711/Xindr`. Framework: Next.js (detected). Install command: `pnpm install`.
2. **Environment variables** (Production), from Supabase > Project Settings > API:
   | Name                            | Value                                           |
   | ------------------------------- | ----------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://<your-ref>.supabase.co`                |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the **anon / publishable** key                  |
   | `SUPABASE_SERVICE_ROLE_KEY`     | the **service_role / secret** key (server only) |
   | `NEXT_PUBLIC_APP_URL`           | `https://<your-vercel-domain>`                  |
3. Deploy. Then set the Supabase Site URL and redirect URLs (step 1.3) to the final domain if it changed, and redeploy if you changed `NEXT_PUBLIC_*` values (they are baked in at build time).
4. Preview deployments: point them at a **separate** dev Supabase project (set the Preview environment variables to that project), never production.

### 4. Check

- Open the Vercel URL on an iPhone in Safari: sign in, onboard, and add it to the Home Screen (Share > Add to Home Screen). It opens full-screen with the app icon.
- Run the manual QA checklist above with two people.
- Supabase free projects pause after about a week without traffic: keep it active or upgrade before a real launch.

## Notes

- Next.js 16 renamed `middleware.ts` to `proxy.ts`; session refresh lives there (`lib/supabase/middleware.ts` holds the logic).
- Supabase free projects pause after about a week of inactivity. Keep traffic or upgrade before a real launch.
