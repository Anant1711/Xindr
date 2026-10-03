-- =====================================================================
-- One database round trip per screen. Each screen used to make 3-6
-- separate calls (plus 2 for the session and badge). These functions
-- return everything a screen needs as one JSON document, built from the
-- existing functions so every visibility rule stays exactly the same.
-- =====================================================================

-- Every app request: is onboarding done, and the Chats badge.
create function app_session() returns jsonb
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from profiles where id = (select auth.uid()))
      then jsonb_build_object('has_profile', true, 'badge', chats_badge())
    else jsonb_build_object('has_profile', false, 'badge', 0)
  end;
$$;

-- Nearby: my state, my area, and cards with each person's main photo.
create function nearby_view(p_level level_t default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when not me.is_active
    then jsonb_build_object('active', false, 'area', a.name, 'people', '[]'::jsonb)
    else jsonb_build_object(
      'active', true,
      'area', a.name,
      'people', coalesce((
        -- Everyone returned by nearby_profiles passes can_see, so their photos are viewable.
        select jsonb_agg((to_jsonb(n) - 'ordinality') || jsonb_build_object(
                 'photo_path', coalesce(ph.thumb_path, ph.path)) order by n.ordinality)
        from nearby_profiles(p_level) with ordinality n
        left join profile_photos ph on ph.user_id = n.id and ph.position = 0
      ), '[]'::jsonb))
  end
  from profiles me
  join areas a on a.id = me.area_id
  where me.id = (select auth.uid());
$$;

-- A person's profile (and the Ask screen): card, relationship, photos, surname.
-- Null when get_buddy_profile would hide them.
create function person_view(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with card as (select * from get_buddy_profile(p_id)),
       me as (select (select auth.uid()) as id)
  select jsonb_build_object(
    'card', to_jsonb(c),
    'match_id', (select m.id from matches m, me
                 where m.user_a = least(me.id, p_id) and m.user_b = greatest(me.id, p_id)
                   and m.ended_at is null),
    'request', (select jsonb_build_object('id', r.id, 'from_me', r.from_user = me.id,
                                          'proposed_at', r.proposed_at, 'note', r.note)
                from train_requests r, me
                where r.status = 'pending'
                  and ((r.from_user = me.id and r.to_user = p_id)
                    or (r.from_user = p_id and r.to_user = me.id))
                order by r.created_at desc limit 1),
    'last_name', visible_last_name(p_id),
    'photos', coalesce((select jsonb_agg(jsonb_build_object(
                          'path', ph.path, 'width', ph.width, 'height', ph.height)
                          order by ph.position)
                        from profile_photos_of(p_id) ph), '[]'::jsonb))
  from card c;
$$;

-- Chat thread: header, plan, and the newest messages (oldest first).
create function thread_view(p_match uuid, p_limit int default 50) returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select (select auth.uid()) as id),
  recent as (
    select x.id, x.sender_id, x.body, x.created_at
    from messages x where x.match_id = p_match
    order by x.created_at desc limit least(p_limit, 200) + 1
  )
  select jsonb_build_object(
    'other_id', o.id,
    'first_name', o.first_name,
    'last_initial', o.last_initial,
    'last_name', visible_last_name(o.id),
    'ended', m.ended_at is not null,
    'proposed_at', r.proposed_at,
    'place', coalesce((select b.gym_name from get_buddy_profile(o.id) b),
                      (select g.name from profiles p join gyms g on g.id = p.gym_id
                       where p.id = me.id),
                      (select a.name from profiles p join areas a on a.id = p.area_id
                       where p.id = me.id)),
    'has_more', (select count(*) from recent) > least(p_limit, 200),
    'messages', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at)
                          from (select * from recent order by created_at desc
                                limit least(p_limit, 200)) t), '[]'::jsonb))
  from matches m
  cross join me
  join profiles o on o.id = case when m.user_a = me.id then m.user_b else m.user_a end
  left join train_requests r on r.id = m.request_id
  where m.id = p_match and me.id in (m.user_a, m.user_b);
$$;

-- Chats tab: incoming and outgoing pending requests, and conversations.
create function chats_view() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select (select auth.uid()) as id)
  select jsonb_build_object(
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'proposed_at', r.proposed_at, 'note', r.note,
               'person', jsonb_build_object('id', p.id, 'first_name', p.first_name,
                                            'last_initial', p.last_initial))
               order by r.created_at desc)
      from train_requests r join profiles p on p.id = r.from_user
      where r.to_user = me.id and r.status = 'pending' and r.proposed_at > now()
        and not is_blocked(me.id, p.id)), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'proposed_at', r.proposed_at,
               'person', jsonb_build_object('id', p.id, 'first_name', p.first_name,
                                            'last_initial', p.last_initial))
               order by r.created_at desc)
      from train_requests r join profiles p on p.id = r.to_user
      where r.from_user = me.id and r.status = 'pending' and r.proposed_at > now()
        and not is_blocked(me.id, p.id)), '[]'::jsonb),
    'conversations', coalesce((
      select jsonb_agg(to_jsonb(c) || jsonb_build_object('last_name', l.last_name)
                       order by c.last_at desc)
      from my_conversations() c
      left join my_match_last_names() l on l.other_id = c.other_id), '[]'::jsonb))
  from me;
$$;

-- My Profile tab.
create function profile_view() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'first_name', p.first_name,
    'last_initial', p.last_initial,
    'last_name', p.last_name,
    'level', p.level,
    'show_me', p.show_me,
    'is_active', p.is_active,
    'area', a.name,
    'blocked_count', (select count(*) from blocks b where b.blocker_id = p.id),
    'photos', coalesce((select jsonb_agg(jsonb_build_object(
                          'id', ph.id, 'path', ph.path, 'thumb_path', ph.thumb_path,
                          'position', ph.position) order by ph.position)
                        from profile_photos ph where ph.user_id = p.id), '[]'::jsonb))
  from profiles p join areas a on a.id = p.area_id
  where p.id = (select auth.uid());
$$;

revoke execute on function app_session(), nearby_view(level_t), person_view(uuid),
  thread_view(uuid, int), chats_view(), profile_view() from public, anon;
grant execute on function app_session(), nearby_view(level_t), person_view(uuid),
  thread_view(uuid, int), chats_view(), profile_view() to authenticated;
