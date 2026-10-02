-- =====================================================================
-- Full last name, shown only to yourself and to people you are matched with.
-- Strangers and pending requesters keep seeing "First L." (last_initial).
--
-- RLS is row-level, and profiles_select_connected lets anyone with a request
-- (even pending) read your row, so the column itself is withheld from direct
-- selects; it is reachable only through the functions below.
-- =====================================================================
alter table profiles
  add column last_name text check (char_length(last_name) between 1 and 40);

-- Initials from Google names can be non-Latin letters (e.g. "Ç", "अ").
alter table profiles drop constraint profiles_last_initial_check;
alter table profiles add constraint profiles_last_initial_check
  check (last_initial ~ '^[[:alpha:]]$');

-- Column-level SELECT: everything except last_name.
revoke select on profiles from authenticated;
grant select (id, first_name, last_initial, gender, level, area_id, gym_id, time_of_day,
              training_days, focus, show_me, women_only_visibility, is_active, avatar_url,
              confirmed_18_at, created_at, updated_at)
  on profiles to authenticated;

-- One person's last name: yours, or someone you have a match with (active or
-- ended) and no block either way. Null otherwise.
create function visible_last_name(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select p.last_name
  from profiles p
  where p.id = p_id
    and (
      p_id = auth.uid()
      or (
        not is_blocked(auth.uid(), p_id)
        and exists (
          select 1 from matches m
          where m.user_a = least(auth.uid(), p_id)
            and m.user_b = greatest(auth.uid(), p_id)
        )
      )
    );
$$;

-- Last names of everyone you are matched with (for the Chats list).
create function my_match_last_names()
returns table (other_id uuid, last_name text)
language sql stable security definer set search_path = public as $$
  select o.id, o.last_name
  from matches m
  join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where auth.uid() in (m.user_a, m.user_b)
    and o.last_name is not null
    and not is_blocked(auth.uid(), o.id);
$$;

revoke execute on function visible_last_name(uuid), my_match_last_names()
  from public, anon, authenticated;
grant execute on function visible_last_name(uuid), my_match_last_names() to authenticated;
