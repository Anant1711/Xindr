-- =====================================================================
-- Query tuning (no behaviour change).
-- 1. RLS policies call auth.uid() through a sub-select so Postgres
--    evaluates it once per query instead of once per row (Supabase's
--    documented "initPlan" fix).
-- 2. nearby_profiles filters cheap columns before the per-row visibility
--    check and computes shared days once per person instead of twice.
-- =====================================================================

alter policy profiles_select_self on profiles
  using (id = (select auth.uid()));
alter policy profiles_select_connected on profiles
  using (
    not is_blocked((select auth.uid()), profiles.id)
    and exists (select 1 from train_requests r
                where (r.from_user = (select auth.uid()) and r.to_user = profiles.id)
                   or (r.to_user = (select auth.uid()) and r.from_user = profiles.id)));
alter policy profiles_insert_self on profiles
  with check (id = (select auth.uid()));
alter policy profiles_update_self on profiles
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy requests_select on train_requests
  using ((select auth.uid()) in (from_user, to_user));
alter policy matches_select on matches
  using ((select auth.uid()) in (user_a, user_b));
alter policy messages_select on messages
  using (exists (select 1 from matches m
                 where m.id = messages.match_id and (select auth.uid()) in (m.user_a, m.user_b)));
alter policy messages_insert on messages
  with check (sender_id = (select auth.uid())
              and exists (select 1 from matches m
                          where m.id = messages.match_id and m.ended_at is null
                            and (select auth.uid()) in (m.user_a, m.user_b)));

alter policy blocks_select on blocks using (blocker_id = (select auth.uid()));
alter policy blocks_delete on blocks using (blocker_id = (select auth.uid()));
alter policy reports_insert on reports with check (reporter_id = (select auth.uid()));
alter policy feedback_insert on feedback with check (user_id = (select auth.uid()));

alter policy photos_select_own on profile_photos using (user_id = (select auth.uid()));
alter policy photos_insert_own on profile_photos with check (user_id = (select auth.uid()));
alter policy photos_delete_own on profile_photos using (user_id = (select auth.uid()));

alter policy "profile photos: upload to own folder" on storage.objects
  with check (bucket_id = 'profile-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);
alter policy "profile photos: delete own" on storage.objects
  using (bucket_id = 'profile-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Same rows, same order as before. Everyone else must be active (can_see
-- requires it, and the partial indexes cover it), and the level filter
-- applies before the per-row can_see call.
create or replace function nearby_profiles(p_level level_t default null, p_limit int default 50)
returns setof buddy_card
language sql stable security definer set search_path = public as $$
  select t.id, t.first_name, t.last_initial, t.gender, t.level,
         ta.name, g.name,
         coalesce(t.gym_id = me.gym_id, false),
         round(distance_km(ma.lat, ma.lng, ta.lat, ta.lng)::numeric, 1),
         t.time_of_day,
         sd.days,
         t.training_days,
         t.focus
  from profiles me
  join areas ma on ma.id = me.area_id
  join profiles t on t.id <> me.id and t.is_active
                 and (p_level is null or t.level = p_level)
  join areas ta on ta.id = t.area_id
  left join gyms g on g.id = t.gym_id
  cross join lateral (select shared_days(me.id, t.id) as days) sd
  where me.id = (select auth.uid())
    and can_see(me.id, t.id)
  order by coalesce(t.gym_id = me.gym_id, false) desc,
           cardinality(sd.days) desc,
           distance_km(ma.lat, ma.lng, ta.lat, ta.lng) asc
  limit least(p_limit, 100);
$$;
