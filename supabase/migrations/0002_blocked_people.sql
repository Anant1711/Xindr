-- =====================================================================
-- Blocked people list for the Profile tab.
-- RLS hides a blocked person's profile row from the blocker (on purpose),
-- so the list needs a narrow RPC: only people the CALLER blocked, and only
-- the fields shown in the list. Nothing new is exposed.
-- =====================================================================
create function my_blocked_people()
returns table (id uuid, first_name text, last_initial text, blocked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.first_name, p.last_initial, b.created_at
  from blocks b
  join profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;

revoke execute on function my_blocked_people() from public, anon, authenticated;
grant execute on function my_blocked_people() to authenticated;
