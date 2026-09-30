# Gym Buddy — Build Specification for Claude Code

> **Your role:** senior full-stack engineer building the MVP below, phase by phase, with me reviewing between phases. Read this entire document before writing any code. Where this document and your instincts disagree, follow the document and tell me why you disagree. Do not add features that are not listed.

---

## 1. The product in one paragraph

A mobile-first web app (installable PWA) that helps people, especially beginners, **find a gym buddy nearby**. A person creates a short profile (level: beginner / intermediate / pro, gender, area, gym, usual training time and days), browses nearby people, and sends an **"Ask to Train"** request proposing a time. If the other person accepts, a private chat opens so they can coordinate. That is the whole product.

- It is a **platonic fitness-partner app, not a dating app.** No romantic framing anywhere in copy, UI, or features.
- Launch is **hyperlocal**: Pimple Saudagar / Pimpri-Chinchwad (Pune), India. Safety, trust, and a good empty state matter more than feature count.
- Users are often intimidated beginners and women, so **privacy controls and safety features are core, not extras.**

## 2. Scope

**In v1**

1. Sign in (Google + email one-time code). Phone OTP is deferred (see §12).
2. Onboarding: profile + preferences + 18+ confirmation.
3. **Nearby** list with level filter; person detail page.
4. **Ask to Train** request with suggested times, optional note.
5. **Chats** tab: incoming requests (accept/decline), waiting requests (cancel), conversations.
6. Realtime **chat**, unlocked only after a request is accepted.
7. Safety: report, block/unblock, "only women can see me", pause my profile, delete my account.
8. Installable PWA with in-app badges.

**Explicitly out of v1 (do not build)**

Group events, communities, dating features, workout logging or streaks, payments, photo upload, video/voice, push notifications (in-app badges only), admin dashboard (use the Supabase dashboard), multi-language, native iOS/Android apps, AI features.

## 3. Working agreement

1. **Work in the phases in §10.** At the end of each phase: run typecheck, lint, and tests; then give me a short summary covering what you built, what you deliberately did not build, and any deviation from this spec. **Then stop and wait for my go-ahead.**
2. Before each phase, post a brief plan (files you will create or change). Do not start coding until you have posted it.
3. **TypeScript strict mode. No `any`.** Validate all external input with `zod`. Prefer server components and server actions; use client components only for interactivity.
4. Small, focused commits with clear messages. Never commit `.env*` files.
5. Do not add a dependency outside the stack in §4 without asking me. Explain what it replaces.
6. **Never** expose the Supabase service-role key to the browser. **Never** disable RLS. **Never** read other users' rows with `select *` from the client; discovery goes through the RPCs defined in the migration.
7. If a requirement is ambiguous, pick the simplest option that keeps the security rules intact, note the assumption in your phase summary, and continue. Only stop to ask if you are blocked.
8. Keep `README.md` current: setup, env vars, how to run locally, how to run tests, how to deploy.

## 4. Tech stack (chosen for $0 to start)

| Layer | Choice |
|---|---|
| Framework | **Next.js (App Router) + TypeScript**, latest stable, pin versions |
| Styling | **Tailwind CSS**, custom iOS-style components. No third-party UI kit. |
| Backend | **Supabase**: Postgres, Auth, Realtime, RLS |
| Supabase client | `@supabase/supabase-js` + `@supabase/ssr` (cookie-based sessions; no auth tokens in localStorage) |
| Validation | `zod` |
| Dates | `date-fns` + `date-fns-tz`; store UTC, display in `Asia/Kolkata` via one constant `APP_TZ` |
| Tests | `vitest` for unit tests; **pgTAP** via `supabase test db` for database and RLS tests |
| Hosting | **Vercel** (free tier) + Supabase free tier |
| Package manager | `pnpm` (fall back to `npm` if unavailable) |

**Suggested layout**

```
app/
  (auth)/login/
  (onboarding)/onboarding/           # 2 steps
  (app)/layout.tsx                   # iOS shell + tab bar
  (app)/nearby/
  (app)/people/[id]/                 # buddy profile
  (app)/people/[id]/ask/             # Ask to Train (modal-style page)
  (app)/chats/                       # requests + conversations
  (app)/chats/[matchId]/             # thread
  (app)/profile/                     # settings-style + sub pages
  (legal)/terms, (legal)/privacy, (legal)/safety
  api/account/delete/route.ts        # server-only, uses service role
components/ios/                      # NavBar, LargeTitle, ListGroup, ListRow, Segmented, Toggle,
                                     # Button, TabBar, Avatar, DayPills, ActionSheet, Sheet, Toast
lib/supabase/{client,server,middleware}.ts
lib/{slots,format,validation,constants}.ts
supabase/migrations/0001_init.sql
supabase/tests/
scripts/seed-dev.ts
design/                              # screenshots of the 6 mockups (visual source of truth)
docs/BUILD_SPEC.md                   # this file
```

## 5. Design system ("native iOS look, calm and uncluttered")

The mockups are in `/design` (six screenshots). **They are the visual source of truth.** Match them closely. The tokens below let you match even without the images.

> Note: the mockups draw a fake iOS status bar (9:41, battery) for realism. **Do not render a status bar in the real app.** Respect the device's own safe areas instead.

**Tokens**

| Token | Value |
|---|---|
| Page background (grouped) | `#F2F2F7` |
| Card / row background | `#FFFFFF` |
| Label | `#000000` |
| Secondary label | `#8A8A8E` |
| Separator (hairline 0.5px) | `#E3E3E6` |
| Accent / primary | `#007AFF` |
| Success / "on" / shared days | `#34C759` |
| Destructive | `#FF3B30` |
| Segmented track | `#E4E4E8` (selected segment: white, radius 8, soft shadow) |
| Font | `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif` |
| Large title | 34px / 700 / letter-spacing -0.4px |
| Nav title | 17px / 600 |
| Body | 17px; secondary text 14–15px; section headers 13px uppercase, secondary colour |
| Tab labels | 10px |
| Grouped list | margin 0 16px, radius 12, overflow hidden, rows min-height 44 (people rows 60), inset hairline dividers |
| Primary button | height 50, radius 14, filled `#007AFF`, white 17px / 600 |
| Toggle | 51 × 31 pill, green when on, white knob with shadow |
| Avatar | circle with initials; background picked deterministically from the user id out of a muted palette, e.g. `#8E5A73 #3D6B52 #4A5E82 #8A6B3E #6B5B8A #5A7A7A` |

**Behaviour rules**

- Mobile first, designed at 390×844. On desktop, render the app in a centred column (max-width 430px) on a neutral background.
- Use `viewport-fit=cover`, `env(safe-area-inset-*)` padding, and `100dvh` (never `100vh`).
- Inputs use font-size ≥ 16px (prevents iOS zoom on focus). Tap targets ≥ 44×44.
- Tab bar: 3 tabs (Nearby, Chats, Profile), translucent with blur, bottom safe-area padding, badge dot/count on Chats.
- Respect `prefers-reduced-motion`. Nice-to-have after Phase 6: collapsing large title on scroll and iOS-style push/pop transitions.
- Use inline SVG icons in an SF-Symbols-like outline style. No emoji in the UI.
- Copy is short, calm, and plain. No exclamation marks, no fitness clichés.

**Screens** (bind to data as described)

1. **About You** (onboarding step 1): modal-style nav (title, Next). Rows and controls in grouped lists.
2. **Preferences** (onboarding step 2): "Show me" segmented; "Only women can see me" toggle with helper text; Get Started button.
3. **Nearby** (tab): large title, level segmented control (All / Beginner / Intermediate / Pro), section header `NEAR {AREA}`, grouped list of people rows (avatar, `First L.`, subtitle `Level · distance`, chevron).
4. **Buddy profile**: nav with Back and a `•••` button that opens an action sheet (Report, Block, Cancel); centred avatar, name, `Level · Gender · distance away`; grouped rows (Usually trains, Focus, Gym); `YOUR OVERLAP` card with Mon–Sun pills (green = shared) and a one-line caption; bottom action area.
5. **Ask to Train**: modal-style nav (Cancel / Send); `SUGGESTED TIMES` radio list; `NOTE (OPTIONAL)` text field; footnote "First sessions happen at the gym, in public."
6. **Chats** (tab): large title; `NEW REQUEST` card(s) with Accept / Decline; `MESSAGES` list.

Screens not in the mockups (Login, Thread, Profile tab, Report sheet, legal pages, empty states) must reuse the same components and tokens.

## 6. Data model

Postgres on Supabase. The migration below is **tested** (applied to a real Postgres and exercised by ~40 behavioural checks). Apply it **verbatim** as `supabase/migrations/0001_init.sql`. If you need to change it, tell me first, add a new migration instead of editing this one, and update the tests.

Key rules it enforces (do not re-implement these in app code; rely on them):

- **Discovery visibility:** a viewer sees a person only if the viewer's `show_me` allows that person's gender, the person has not hidden themselves from men (`women_only_visibility`) unless the viewer is a woman, neither has blocked the other, both are active.
- **People you have no connection with are only reachable through** `nearby_profiles()` and `get_buddy_profile()`. Direct `select` on `profiles` returns only your own row plus people you already have a request or match with.
- **Requests, matches, and blocks are written only through RPCs** (`send_request`, `respond_to_request`, `cancel_request`, `end_match`, `block_user`). Direct writes are revoked.
- **One pending request per pair** (either direction), max 10 pending outgoing per user, time must be in the future, no request if an active match exists.
- **Chat exists only after acceptance** (a `matches` row). Ended matches (by end or block) are read-only.
- **Blocking is silent:** the other person just sees "cancelled" / "conversation ended". Never reveal who blocked whom.
- **Location is area-level only.** Users pick an area from a seeded list; distance is between area centres. No GPS, no coordinates sent to clients.
- Errors raised by RPCs you must handle in the UI: `not_allowed`, `time_in_past`, `already_matched`, `too_many_pending`, `request_not_found`, `not_authenticated`, plus Postgres `23505` (duplicate pending request).

### `supabase/migrations/0001_init.sql`

```sql
-- =====================================================================
-- Gym Buddy MVP — initial schema
-- Target: Supabase (Postgres 15+). All app data lives in `public`.
-- Auth users live in Supabase's `auth.users` (managed by Supabase).
-- =====================================================================

-- ---------- Enums ----------
create type gender_t         as enum ('woman', 'man', 'other');
create type level_t          as enum ('beginner', 'intermediate', 'pro');
create type time_of_day_t    as enum ('morning', 'evening');
create type show_me_t        as enum ('women', 'men', 'anyone');
create type request_status_t as enum ('pending', 'accepted', 'declined', 'cancelled', 'expired');
create type report_reason_t  as enum ('harassment', 'fake_profile', 'inappropriate_message', 'unsafe_behavior', 'other');

-- ---------- Reference data ----------
create table areas (
  id   smallint generated always as identity primary key,
  name text not null unique,
  city text not null,
  lat  double precision not null,
  lng  double precision not null
);

create table gyms (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  area_id smallint not null references areas(id),
  unique (name, area_id)
);

-- ---------- Profiles (1:1 with auth.users) ----------
create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  first_name            text not null check (char_length(first_name) between 1 and 30),
  last_initial          text not null check (last_initial ~ '^[A-Za-z]$'),
  gender                gender_t not null,
  level                 level_t not null,
  area_id               smallint not null references areas(id),
  gym_id                uuid references gyms(id) on delete set null,
  time_of_day           time_of_day_t not null,
  -- 0 = Monday ... 6 = Sunday
  training_days         smallint[] not null default '{}'
                          check (training_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  focus                 text check (char_length(focus) <= 60),
  show_me               show_me_t not null default 'anyone',
  women_only_visibility boolean not null default false
                          check (not women_only_visibility or gender <> 'man'),
  is_active             boolean not null default true,
  avatar_url            text,                         -- reserved; v1 UI uses initials
  confirmed_18_at       timestamptz not null,         -- explicit 18+ confirmation, set by the app
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index profiles_area_idx  on profiles (area_id) where is_active;
create index profiles_level_idx on profiles (level)   where is_active;

create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_set_updated before update on profiles
  for each row execute function set_updated_at();

-- ---------- Safety ----------
create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  reported_id uuid references profiles(id) on delete set null,
  reason      report_reason_t not null,
  details     text check (char_length(details) <= 1000),
  status      text not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  created_at  timestamptz not null default now()
);

-- ---------- Requests, matches, messages ----------
create table train_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references profiles(id) on delete cascade,
  to_user      uuid not null references profiles(id) on delete cascade,
  proposed_at  timestamptz not null,
  note         text check (char_length(note) <= 200),
  status       request_status_t not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (from_user <> to_user)
);
-- Only one pending request per pair, in either direction.
create unique index one_pending_request_per_pair
  on train_requests (least(from_user, to_user), greatest(from_user, to_user))
  where status = 'pending';
create index train_requests_to_idx   on train_requests (to_user, status);
create index train_requests_from_idx on train_requests (from_user, status);

create table matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references profiles(id) on delete cascade,  -- always the smaller uuid
  user_b     uuid not null references profiles(id) on delete cascade,  -- always the larger uuid
  request_id uuid references train_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  ended_at   timestamptz,
  ended_by   uuid references profiles(id) on delete set null,
  check (user_a < user_b)
);
create unique index one_active_match_per_pair on matches (user_a, user_b) where ended_at is null;

create table messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references matches(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index messages_match_created_idx on messages (match_id, created_at);

-- ---------- Feedback (also used for "my area isn't listed") ----------
create table feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  kind       text not null check (kind in ('area_request','general','bug')),
  message    text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Helper functions
-- Each guards on auth.uid() so they cannot be used to probe other
-- people's relationships.
-- =====================================================================
create function distance_km(lat1 double precision, lng1 double precision,
                            lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

create function is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() in (a, b) and exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- Can `viewer` (must be the caller) see `target` in discovery?
--  * viewer's show_me must allow target's gender
--  * if target hid themselves from men, viewer must be a woman
--  * neither has blocked the other; both active; not the same person
create function can_see(viewer uuid, target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select viewer = auth.uid() and exists (
    select 1
    from profiles v, profiles t
    where v.id = viewer and t.id = target
      and v.id <> t.id
      and v.is_active and t.is_active
      and (v.show_me = 'anyone'
           or (v.show_me = 'women' and t.gender = 'woman')
           or (v.show_me = 'men'   and t.gender = 'man'))
      and (not t.women_only_visibility or v.gender = 'woman')
      and not exists (
        select 1 from blocks b
        where (b.blocker_id = v.id and b.blocked_id = t.id)
           or (b.blocker_id = t.id and b.blocked_id = v.id)));
$$;

-- Days (0=Mon..6=Sun) both people train, only when they share the same time of day.
create function shared_days(a uuid, b uuid) returns smallint[]
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select array(select d from unnest(pa.training_days) d
                  where d = any(pb.training_days) order by d)
     from profiles pa join profiles pb on pb.id = b
     where auth.uid() in (a, b) and pa.id = a and pa.time_of_day = pb.time_of_day),
    '{}'::smallint[]);
$$;

-- =====================================================================
-- Discovery (the ONLY way to read people you have no connection with)
-- =====================================================================
create type buddy_card as (
  id            uuid,
  first_name    text,
  last_initial  text,
  gender        gender_t,
  level         level_t,
  area_name     text,
  gym_name      text,
  same_gym      boolean,
  distance_km   numeric,
  time_of_day   time_of_day_t,
  shared_days   smallint[],
  training_days smallint[],
  focus         text
);

create function nearby_profiles(p_level level_t default null, p_limit int default 50)
returns setof buddy_card
language sql stable security definer set search_path = public as $$
  select t.id, t.first_name, t.last_initial, t.gender, t.level,
         ta.name, g.name,
         coalesce(t.gym_id = me.gym_id, false),
         round(distance_km(ma.lat, ma.lng, ta.lat, ta.lng)::numeric, 1),
         t.time_of_day,
         shared_days(me.id, t.id),
         t.training_days,
         t.focus
  from profiles me
  join areas ma on ma.id = me.area_id
  join profiles t on t.id <> me.id
  join areas ta on ta.id = t.area_id
  left join gyms g on g.id = t.gym_id
  where me.id = auth.uid()
    and can_see(me.id, t.id)
    and (p_level is null or t.level = p_level)
  order by coalesce(t.gym_id = me.gym_id, false) desc,
           cardinality(shared_days(me.id, t.id)) desc,
           distance_km(ma.lat, ma.lng, ta.lat, ta.lng) asc
  limit least(p_limit, 100);
$$;

-- One person's card. Allowed if discoverable, OR if you already have a
-- request/match with them (and no block).
create function get_buddy_profile(p_id uuid)
returns setof buddy_card
language sql stable security definer set search_path = public as $$
  select t.id, t.first_name, t.last_initial, t.gender, t.level,
         ta.name, g.name,
         coalesce(t.gym_id = me.gym_id, false),
         round(distance_km(ma.lat, ma.lng, ta.lat, ta.lng)::numeric, 1),
         t.time_of_day,
         shared_days(me.id, t.id),
         t.training_days,
         t.focus
  from profiles me
  join areas ma on ma.id = me.area_id
  join profiles t on t.id = p_id
  join areas ta on ta.id = t.area_id
  left join gyms g on g.id = t.gym_id
  where me.id = auth.uid()
    and (can_see(me.id, t.id)
         or (not is_blocked(me.id, t.id)
             and exists (select 1 from train_requests r
                         where (r.from_user = me.id and r.to_user = t.id)
                            or (r.from_user = t.id and r.to_user = me.id))));
$$;

-- =====================================================================
-- Actions (all writes to requests / matches / blocks go through these)
-- =====================================================================
create function send_request(p_to uuid, p_proposed_at timestamptz, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if not can_see(v_me, p_to) then raise exception 'not_allowed'; end if;
  if p_proposed_at <= now() then raise exception 'time_in_past'; end if;
  if exists (select 1 from matches m
             where m.ended_at is null
               and m.user_a = least(v_me, p_to) and m.user_b = greatest(v_me, p_to)) then
    raise exception 'already_matched';
  end if;
  if (select count(*) from train_requests where from_user = v_me and status = 'pending') >= 10 then
    raise exception 'too_many_pending';
  end if;
  -- A duplicate pending request for the pair raises unique_violation (23505).
  insert into train_requests (from_user, to_user, proposed_at, note)
  values (v_me, p_to, p_proposed_at, nullif(trim(p_note), ''))
  returning id into v_id;
  return v_id;
end $$;

-- Accept or decline an incoming request. On accept, creates (or reuses) the match.
create function respond_to_request(p_request uuid, p_accept boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r       train_requests;
  v_match uuid;
begin
  select * into r from train_requests
  where id = p_request and to_user = auth.uid() and status = 'pending'
  for update;
  if not found then raise exception 'request_not_found'; end if;
  if is_blocked(r.from_user, r.to_user) then raise exception 'not_allowed'; end if;

  update train_requests
  set status = (case when p_accept then 'accepted' else 'declined' end)::request_status_t,
      responded_at = now()
  where id = r.id;

  if not p_accept then return null; end if;

  insert into matches (user_a, user_b, request_id)
  values (least(r.from_user, r.to_user), greatest(r.from_user, r.to_user), r.id)
  on conflict do nothing
  returning id into v_match;

  if v_match is null then
    select id into v_match from matches
    where user_a = least(r.from_user, r.to_user)
      and user_b = greatest(r.from_user, r.to_user)
      and ended_at is null;
  end if;
  return v_match;
end $$;

create function cancel_request(p_request uuid) returns void
language sql security definer set search_path = public as $$
  update train_requests set status = 'cancelled', responded_at = now()
  where id = p_request and from_user = auth.uid() and status = 'pending';
$$;

create function end_match(p_match uuid) returns void
language sql security definer set search_path = public as $$
  update matches set ended_at = now(), ended_by = auth.uid()
  where id = p_match and ended_at is null and auth.uid() in (user_a, user_b);
$$;

-- Blocking silently cancels pending requests and ends active matches.
-- The blocked person just sees a generic "cancelled" / "conversation ended".
create function block_user(p_target uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if p_target = v_me then raise exception 'invalid_target'; end if;
  insert into blocks (blocker_id, blocked_id) values (v_me, p_target) on conflict do nothing;
  update train_requests set status = 'cancelled', responded_at = now()
  where status = 'pending'
    and ((from_user = v_me and to_user = p_target) or (from_user = p_target and to_user = v_me));
  update matches set ended_at = now(), ended_by = v_me
  where ended_at is null
    and user_a = least(v_me, p_target) and user_b = greatest(v_me, p_target);
end $$;

create function mark_messages_read(p_match uuid) returns void
language sql security definer set search_path = public as $$
  update messages set read_at = now()
  where match_id = p_match and sender_id <> auth.uid() and read_at is null
    and exists (select 1 from matches m
                where m.id = p_match and auth.uid() in (m.user_a, m.user_b));
$$;

-- Inbox list: one row per match with last message and unread count.
create function my_conversations()
returns table (match_id uuid, other_id uuid, other_first_name text, other_last_initial text,
               ended boolean, last_body text, last_at timestamptz, unread_count bigint)
language sql stable security definer set search_path = public as $$
  select m.id, o.id, o.first_name, o.last_initial,
         m.ended_at is not null,
         lm.body,
         coalesce(lm.created_at, m.created_at),
         (select count(*) from messages x
          where x.match_id = m.id and x.sender_id <> auth.uid() and x.read_at is null)
  from matches m
  join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  left join lateral (select l.body, l.created_at from messages l
                     where l.match_id = m.id order by l.created_at desc limit 1) lm on true
  where auth.uid() in (m.user_a, m.user_b)
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

-- Housekeeping (NOT callable by users). Schedule with pg_cron if enabled:
--   select cron.schedule('expire-requests', '*/30 * * * *', 'select public.expire_stale_requests()');
create function expire_stale_requests() returns void
language sql security definer set search_path = public as $$
  update train_requests set status = 'expired', responded_at = now()
  where status = 'pending' and proposed_at < now();
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table areas          enable row level security;
alter table gyms           enable row level security;
alter table profiles       enable row level security;
alter table blocks         enable row level security;
alter table reports        enable row level security;
alter table train_requests enable row level security;
alter table matches        enable row level security;
alter table messages       enable row level security;
alter table feedback       enable row level security;

create policy areas_read on areas for select to authenticated using (true);
create policy gyms_read  on gyms  for select to authenticated using (true);

-- Profiles: you can read yourself and people you have a request/match with.
-- Everyone else is reachable ONLY through nearby_profiles()/get_buddy_profile().
create policy profiles_select_self on profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_select_connected on profiles for select to authenticated
  using (
    not is_blocked(auth.uid(), profiles.id)
    and exists (select 1 from train_requests r
                where (r.from_user = auth.uid() and r.to_user = profiles.id)
                   or (r.to_user = auth.uid() and r.from_user = profiles.id)));
create policy profiles_insert_self on profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update_self on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy requests_select on train_requests for select to authenticated
  using (auth.uid() in (from_user, to_user));

create policy matches_select on matches for select to authenticated
  using (auth.uid() in (user_a, user_b));

create policy messages_select on messages for select to authenticated
  using (exists (select 1 from matches m
                 where m.id = messages.match_id and auth.uid() in (m.user_a, m.user_b)));
create policy messages_insert on messages for insert to authenticated
  with check (sender_id = auth.uid()
              and exists (select 1 from matches m
                          where m.id = messages.match_id and m.ended_at is null
                            and auth.uid() in (m.user_a, m.user_b)));

create policy blocks_select on blocks for select to authenticated using (blocker_id = auth.uid());
create policy blocks_delete on blocks for delete to authenticated using (blocker_id = auth.uid());

create policy reports_insert on reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy feedback_insert on feedback for insert to authenticated
  with check (user_id = auth.uid());

-- Belt and braces: no direct writes where an RPC is the only allowed path.
revoke insert, update, delete on train_requests, matches from authenticated;
revoke insert, update         on blocks from authenticated;
revoke update, delete         on messages from authenticated;
revoke select, update, delete on reports from authenticated;
revoke select, update, delete on feedback from authenticated;

-- =====================================================================
-- Function privileges: nothing is callable unless explicitly granted.
-- =====================================================================
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  distance_km(double precision, double precision, double precision, double precision),
  is_blocked(uuid, uuid),
  can_see(uuid, uuid),
  shared_days(uuid, uuid),
  nearby_profiles(level_t, int),
  get_buddy_profile(uuid),
  send_request(uuid, timestamptz, text),
  respond_to_request(uuid, boolean),
  cancel_request(uuid),
  end_match(uuid),
  block_user(uuid),
  mark_messages_read(uuid),
  my_conversations()
to authenticated;

-- =====================================================================
-- Realtime (respects RLS)
-- =====================================================================
alter publication supabase_realtime add table messages, train_requests, matches;

-- =====================================================================
-- Seed: launch areas (Pune / Pimpri-Chinchwad). Coordinates are APPROXIMATE
-- area centres — verify on a map before launch. Add real gyms via the
-- Supabase dashboard; do not invent gym names.
-- =====================================================================
insert into areas (name, city, lat, lng) values
  ('Pimple Saudagar', 'Pune', 18.6000, 73.7950),
  ('Wakad',           'Pune', 18.5990, 73.7610),
  ('Pimple Gurav',    'Pune', 18.5935, 73.8150),
  ('Pimpri',          'Pune', 18.6270, 73.8000),
  ('Chinchwad',       'Pune', 18.6430, 73.8030),
  ('Baner',           'Pune', 18.5590, 73.7860),
  ('Aundh',           'Pune', 18.5580, 73.8080);
```

### Optional Phase 8 migration: `0002_checkins.sql`

Do not apply until I ask.

```sql
-- =====================================================================
-- OPTIONAL (Phase 8) — "Did you train together?" confirmations.
-- Lets you measure the metric that matters: pairs who actually met.
-- =====================================================================
create table session_confirmations (
  request_id uuid not null references train_requests(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  happened   boolean not null,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);
alter table session_confirmations enable row level security;

create policy sc_select on session_confirmations for select to authenticated
  using (user_id = auth.uid());
create policy sc_insert on session_confirmations for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from train_requests r
                          where r.id = session_confirmations.request_id
                            and r.status = 'accepted'
                            and r.proposed_at < now()
                            and auth.uid() in (r.from_user, r.to_user)));
revoke update, delete on session_confirmations from authenticated;
```

## 7. Security and privacy requirements (non-negotiable)

1. RLS is enabled on every table and stays enabled. Every new table needs RLS and policies in its own migration.
2. The service-role key is used **only** in `app/api/account/delete/route.ts` and `scripts/seed-dev.ts`, never in client code, never with a `NEXT_PUBLIC_` prefix.
3. Never copy email or phone into `profiles`. Other users must never be able to obtain another user's email, phone, exact area centre, or user-id-to-identity mapping beyond what `buddy_card` returns.
4. Do not create **views** in the `public` schema (they bypass RLS by default). Use RPCs.
5. A hidden profile (women-only, blocked, inactive, filtered out) opened by direct URL must render a generic **404**, identical to a non-existent id. No "this user is hidden" messages.
6. Render message text as plain text only. Never `dangerouslySetInnerHTML`. Do not auto-link URLs in v1.
7. Validate on the client for UX, on the server for safety, and rely on the DB constraints as the final guard. Return generic error messages; never leak SQL errors to the UI.
8. Set sensible security headers in `next.config` (CSP that allows your Supabase project URL and websockets, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`).
9. Do not log personal data (names, messages, emails) in server logs.
10. **18+ only.** Onboarding cannot complete without an explicit 18+ confirmation, stored in `confirmed_18_at`.
11. **Data rights:** provide a Privacy Policy page, a consent checkbox at signup, data minimisation (only the fields in the schema), and a working **Delete my account** that erases all of the person's data (the schema cascades from `auth.users`). Write these pages as clear plain-language drafts and add a visible note that they need review by a lawyer before public launch (India's DPDP Act applies).
12. **Safety copy, always visible where relevant:** "First sessions happen at the gym, in public." Add a short Safety page: meet in public, tell a friend, trust your instincts, use Report and Block.

## 8. Application behaviour

### 8.1 Auth and routing

- **Login screen:** "Continue with Google" and "Continue with email". Email flow: enter email, receive a **6-digit code**, enter it (`signInWithOtp` then `verifyOtp` with type `email`). The Supabase email template must include `{{ .Token }}`; document this in the README.
- Middleware refreshes the session. Routing rules: no session goes to `/login`; session but no profile row goes to `/onboarding`; otherwise the app shell.
- Sign out is in the Profile tab.

### 8.2 Onboarding (two steps)

Step 1, **About You** (extend the mockup with the extra fields, same grouped-list style):

| Field | Control | Rules |
|---|---|---|
| First name | text | 1–30 chars |
| Last initial | text | one letter; shown as `Priya S.` |
| Gender | Woman / Man / Other | required |
| Level | segmented Beginner / Intermediate / Pro | required |
| Area | picker list from `areas` | required. Include "My area isn't listed", which opens a small form that inserts a `feedback` row (`kind = 'area_request'`) and shows a thank-you. |
| Gym | optional picker filtered by chosen area, plus "Not listed" | sets `gym_id` or null |
| Usually trains | segmented Morning / Evening | required |
| Days | 7 tappable pills Mon–Sun (same pill component as the overlap card) | at least 1 day |
| Focus | optional text, max 60 | e.g. "Strength, general fitness" |

Step 2, **Preferences:** "Show me" segmented (Women / Men / Anyone, default Anyone); **"Only women can see me"** toggle (show it only when gender is not "Man"; default off; helper text "Your profile stays hidden from men."); 18+ checkbox with links to Terms and Privacy. "Get Started" inserts the `profiles` row (including `confirmed_18_at = now()`) and routes to Nearby.

### 8.3 Nearby

- Calls `nearby_profiles(p_level)`. The segmented control maps to the level filter (All = null).
- Section header: `NEAR {AREA NAME}` (the viewer's area).
- Row subtitle: `{Level} · {distance}` where distance label is: `Same gym` if `same_gym`; else `Same area` if `distance_km < 0.5`; else `{distance_km} km`. Distances are approximate (area centre to area centre); do not present them as exact.
- Pull-to-refresh or refetch on focus. Show skeleton rows while loading.
- **Empty state (important, because early on it will often be empty):** short calm message ("No one nearby yet"), a line explaining it grows as friends join, and an **Invite a friend** button using the Web Share API (fallback: copy link).

### 8.4 Buddy profile (`/people/[id]`)

- Loads `get_buddy_profile(id)`. Empty result means 404 (see §7.5).
- Rows: **Usually trains** (`Mornings` / `Evenings`), **Focus** (or "Not set"), **Gym** (if any).
- **Your overlap:** Mon–Sun pills, green where `shared_days` includes the day. Caption: `{n} shared {mornings|evenings} a week` or "No overlap in your usual days yet". Overlap only exists when both people train at the same time of day (the DB already enforces this).
- **Bottom action area depends on relationship state** (load the pair's latest request and active match):
  - None: primary **Ask to Train**.
  - You sent a pending request: disabled "Request sent" plus a plain **Cancel request** button.
  - They sent you a pending request: **Accept** and **Decline**.
  - Active match: primary **Message** (opens the thread).
  - Otherwise declined/expired/ended: **Ask to Train** again.
  - The mockup shows a Message button under Ask to Train; in v1 it appears **only when a match is active**, because chat is unlocked only after acceptance.
- `•••` opens an iOS-style **action sheet**: Report…, Block, Cancel. Block asks for confirmation and, after success, navigates back to Nearby.
- **Report** sheet: pick a reason from `report_reason_t`, optional details (max 1000), submit inserts into `reports`, toast "Thanks. We'll review this."

### 8.5 Suggested times (`lib/slots.ts`, pure and unit-tested)

```
suggestSlots({ now, sharedDays, targetDays, timeOfDay, tz = APP_TZ }) -> { slots: Date[]; overlap: boolean }
```

- Day index: `0 = Monday ... 6 = Sunday` (matches the DB). Default local times: **morning 07:00, evening 18:30**.
- Candidate days = `sharedDays` if non-empty (`overlap: true`), else `targetDays` (`overlap: false`; the UI then shows "Your usual days don't overlap yet. These are their usual days.").
- For each candidate day take the next occurrence at the default time that is **at least 3 hours after `now`**; return the **earliest 3**, unique, sorted.
- If the target has no training days, return the next 3 calendar days at the default time.
- Labels: `Saturday, 7:00 AM` (weekday, time, in `APP_TZ`). Add `Today` / `Tomorrow` where applicable.
- Unit tests must cover: week wrap (Sunday to Monday), the 3-hour cutoff, IST conversion, a single candidate day, and empty input.

### 8.6 Ask to Train

- First suggested slot preselected. Note is optional, max 200 chars with a counter. **Send** calls `send_request(p_to, p_proposed_at, p_note)`.
- Success: toast "Request sent", go back to the profile, which now shows the sent state.
- Error mapping: `23505` means "You already have a pending request with this person" (open Chats); `too_many_pending` means "You have too many open requests. Wait for replies first."; `time_in_past` means refresh the slots; `not_allowed` / `already_matched` mean a generic friendly message and go back.

### 8.7 Chats tab

- Sections, shown only when non-empty, in this order: **NEW REQUEST** (incoming pending; card with avatar, name, `Wants to train · {slot label}`, **Accept** / **Decline**), **WAITING** (outgoing pending; name, slot label, **Cancel**), **MESSAGES** (`my_conversations()`; unread rows bold; preview of last message; ended conversations dimmed with "Ended").
- Accept calls `respond_to_request(id, true)` and navigates to the new thread. Decline calls it with `false`.
- Tab badge = incoming pending requests + total unread messages. Update live via Realtime subscriptions to `train_requests` and `messages` (RLS already filters what each user receives).
- When querying `train_requests` with embedded profiles, use explicit FK hints (two FKs point to `profiles`), e.g. `sender:profiles!train_requests_from_user_fkey(...)`.
- Empty state: "No messages yet. When someone accepts your request, your chat appears here."

### 8.8 Chat thread (`/chats/[matchId]`)

- iOS Messages look: my messages blue bubbles on the right, theirs light grey on the left, timestamps grouped by day, input bar pinned above the keyboard/safe area.
- A pinned card at the top shows the agreed plan: `{slot label} · {gym or area}` (from the match's request `proposed_at`).
- Load history, then subscribe with Realtime filtered by `match_id`. Append optimistically; on failure show a small "Not sent. Tap to retry".
- Call `mark_messages_read(matchId)` on open and whenever a message arrives while the thread is visible.
- Header: their name (tap opens their profile) and `•••` action sheet: **End conversation** (`end_match`), Report, Block.
- If the match has ended: replace the input with "This conversation has ended." (read-only). Never say why.
- Max message length 2000; trim; ignore empty.

### 8.9 Profile tab and account

Settings-style grouped lists:

- **My details:** edit first name, last initial, gender, level, area, gym, time of day, days, focus (reuse onboarding components).
- **Preferences:** Show me; Only women can see me (hidden for men).
- **Pause my profile:** toggle bound to `is_active` ("Hide me from Nearby while you take a break").
- **Invite a friend** (Web Share).
- **Blocked people:** list with **Unblock** (`delete` from `blocks`).
- **Safety tips**, **Send feedback** (inserts `feedback`, `kind = 'general'`), **Terms**, **Privacy**.
- **Sign out.**
- **Delete my account** (destructive, red): confirmation dialog, then `POST /api/account/delete`, which verifies the session server-side, deletes the auth user with the service-role client (everything cascades), clears the session, and redirects to `/login` with a confirmation message.

### 8.10 States and errors

Every screen needs loading (skeleton), empty, and error states in the same visual language. Network errors show a calm inline message with a Retry button. Never show raw error text.

### 8.11 Formatting helpers (`lib/format.ts`, unit-tested)

`levelLabel`, `genderLabel`, `displayName(first, initial)` returns `Priya S.`, `distanceLabel`, `timeOfDayLabel` (`Mornings` / `Evenings`), `slotLabel(date)`, `relativeTime` for chat list (`9:41 AM`, `Yesterday`, `12 Oct`).

### 8.12 PWA

`manifest.webmanifest` (name "Gym Buddy" as a working title, `display: standalone`, theme and background colours from the tokens), icons (generate simple placeholder icons; I will replace them), `apple-touch-icon`, iOS meta tags (`apple-mobile-web-app-capable`, status-bar style). No offline caching or service worker in v1. Add an unobtrusive "Add to Home Screen" hint for iOS Safari users (dismissible, remembered in `localStorage`).

## 9. Testing

**pgTAP (`supabase/tests/`)**: translate each of these into tests; all must pass before Phase 1 is done.

1. A man cannot discover, or open by id, a profile with `women_only_visibility = true`; a woman can.
2. `show_me = women` hides men and "other"; `show_me = men` hides women and "other".
3. Level filter works; `shared_days` is computed only when both share the same `time_of_day`.
4. Direct `select` on `profiles` returns only your own row; after a request exists between two people, each can read the other's row.
5. Direct inserts into `train_requests` and `matches` fail; direct updates or deletes of `messages` fail; `reports` and `feedback` are not readable by users.
6. `send_request` rejects: hidden target, past time, active match, more than 10 pending, duplicate or reverse-duplicate pending request.
7. Only the recipient can accept or decline; accepting creates exactly one active match; a stranger cannot respond.
8. Only match participants can read or send messages; you cannot send as someone else; you cannot send after the match ends.
9. `block_user` hides both people from each other's discovery, cancels pending requests, ends the active match, and prevents new requests.
10. `can_see` and `shared_days` return false/empty when probed with other people's ids; `expire_stale_requests` is not callable by users.
11. `my_conversations` returns correct unread counts; `mark_messages_read` clears them only for the recipient.

**Vitest:** `slots`, `format`, `validation` (zod schemas).

**Manual QA checklist** (put it in the README): two browsers (one normal, one private) signed in as different users walk through sign-up, discovery, request, accept, chat, block, and delete account. Also test on a real iPhone in Safari and as an installed PWA.

## 10. Phases

Follow the working agreement in §3 for every phase.

**Phase 0: Scaffold.** Repo, Next.js + TS + Tailwind, eslint/prettier, `.env.example`, Supabase CLI config, GitHub Actions running typecheck, lint, unit tests. Build the iOS component kit in `components/ios/` and a dev-only `/dev/components` page showing every component and state. *Done when:* the page visually matches the mockup style on a 390px viewport.

**Phase 1: Database.** Apply `0001_init.sql` locally, generate TypeScript types, write the pgTAP tests from §9. Write `scripts/seed-dev.ts` (12 varied demo users across areas, levels, genders, days; refuses to run unless `ALLOW_DEV_SEED=true` and the URL is local or an allow-listed dev project; never run it against production). *Done when:* all pgTAP tests pass with `supabase test db`.

**Phase 2: Auth and onboarding.** Login (Google + email code), middleware, routing rules, two-step onboarding, validation, "My area isn't listed", profile insert. *Done when:* a new user can sign up, finish onboarding, land on Nearby, and a returning user skips onboarding.

**Phase 3: Nearby and buddy profile.** `nearby_profiles`, level filter, rows, empty state with invite, buddy profile with overlap card and relationship-aware action area (Ask/Cancel/Accept/Decline/Message placeholders wired later). *Done when:* with seed data, visibility rules visibly work (log in as a man and as a woman and compare).

**Phase 4: Ask to Train and requests.** `lib/slots.ts` with tests, Ask to Train page, `send_request` error mapping, Chats tab (new request, waiting, cancel, accept, decline), tab badges via Realtime. *Done when:* two browsers can complete request, accept, and decline flows live without refreshing.

**Phase 5: Chat.** Thread UI, realtime messages, optimistic send with retry, unread and read handling, pinned plan card, end conversation. *Done when:* two browsers chat in real time; an ended or blocked conversation is read-only.

**Phase 6: Safety and account.** Report sheet, block/unblock, pause profile, Profile tab, feedback, legal and safety pages, delete account route. *Done when:* every item in §7 is verifiably true, and account deletion removes the user's rows (verify in the dashboard).

**Phase 7: PWA, polish, deploy.** Manifest and icons, iOS install hint, accessibility pass (labels, focus states, contrast, reduced motion, 44px targets), security headers, Vercel deploy with env vars, Supabase production config (§11), README complete. *Done when:* the app works on my iPhone from a Vercel URL and can be added to the Home Screen.

**Phase 8 (only when I ask): validation features.** Apply `0002_checkins.sql`. After a proposed time passes, show a one-tap prompt "Did you train with {name}?" (Yes / No). Add the metrics queries in Appendix A to `docs/METRICS.md`. Optionally add Web Push for requests and messages (iOS only supports it for installed PWAs, iOS 16.4 or later).

## 11. Deployment and configuration

1. Create a Supabase project. Apply the migration. Add real gyms to `gyms` via the dashboard (do not invent names). **Verify the approximate area coordinates on a map.**
2. **Auth config:** enable Google provider (create OAuth credentials in Google Cloud); enable Email OTP and make the email template show `{{ .Token }}`; set Site URL and Redirect URLs to the Vercel domain and `http://localhost:3000`.
3. **Email sending:** Supabase's built-in email is heavily rate-limited and meant for testing. Configure custom SMTP (for example Resend or Brevo, both have free tiers) before inviting real users.
4. Vercel: import the repo, set the env vars below, deploy. Keep preview deployments pointed at a **separate** dev Supabase project, never production.
5. Optional but recommended: enable `pg_cron` and schedule `expire_stale_requests` every 30 minutes (command is in the migration comments).
6. Free-tier note: Supabase pauses free projects after about a week of inactivity. Mention this in the README and add a reminder to keep traffic or upgrade before any real launch.

**Environment variables**

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | public key, safe with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | used only by account deletion and the dev seed script |
| `NEXT_PUBLIC_APP_URL` | client + server | for share links |
| `ALLOW_DEV_SEED` | local only | must be `true` to run the seed script |

## 12. Decisions already made (do not reopen) and deferred items

**Decided:** web app / PWA first (no native apps yet); Next.js + Supabase + Vercel; platonic buddy app only (no dating); gender filter and women-only visibility are core; area-level location only; chat only after acceptance; no group events in v1; iOS visual style everywhere (no Android/Material variant yet); English only; Asia/Kolkata display time.

**Deferred on purpose:**

- **Phone-number OTP.** It reduces fake accounts, but Supabase needs a paid SMS provider (Twilio and similar) and sending SMS in India requires DLT registration. Start with Google + email code; revisit once there are real users. Keep the auth code structured so adding a phone provider later is a small change.
- **Web Push**, **photo upload**, **ID verification**, **group sessions**, **native apps**: only after the core loop is proven.

**Ask me only if blocked.** Otherwise decide, record the assumption in your phase summary, and continue.

---

## Appendix A: metrics queries (run in the Supabase SQL editor; do **not** create views)

```sql
-- Funnel
select
  (select count(*) from auth.users)                                  as signups,
  (select count(*) from profiles)                                    as onboarded,
  (select count(*) from train_requests)                              as requests_sent,
  (select count(*) from train_requests where status = 'accepted')    as requests_accepted,
  (select count(*) from matches)                                     as matches,
  (select count(distinct match_id) from messages)                    as matches_with_chat;

-- Accept rate and time to first reply
select round(100.0 * count(*) filter (where status = 'accepted') /
             nullif(count(*) filter (where status in ('accepted','declined')), 0), 1) as accept_rate_pct,
       percentile_cont(0.5) within group (order by responded_at - created_at)
         filter (where status in ('accepted','declined'))                              as median_reply_time
from train_requests;

-- Density by area (the number that decides whether this works)
select a.name, count(*) filter (where p.is_active) as active_profiles
from areas a left join profiles p on p.area_id = a.id
group by a.name order by 2 desc;

-- After Phase 8: pairs who actually trained
select count(*) filter (where happened) as confirmed_sessions,
       count(distinct request_id) filter (where happened) as pairs_who_met
from session_confirmations;
```

## Appendix B: definition of done for the whole MVP

- All pgTAP and Vitest tests pass in CI.
- Two real people on two real phones can: sign up, find each other, send and accept a request, and chat in real time.
- A man cannot see a women-only profile by any route (list, direct URL, API call).
- Blocking, reporting, pausing, and deleting an account all work.
- README lets a new developer run the project locally in under 15 minutes.
- No secret is committed; the service-role key never reaches the browser bundle.
