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
