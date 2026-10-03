-- =====================================================================
-- Cheaper Chats badge. The tab bar used to count requests and then load
-- the whole inbox (my_conversations) just to add up unread messages.
-- chats_badge() returns the same number from two indexed counts.
-- =====================================================================

-- "My matches" filters on user_a OR user_b; the pair index only covers user_a.
create index matches_user_b_idx on matches (user_b);
-- Unread counts only ever look at unread rows, which stay few.
create index messages_unread_idx on messages (match_id) where read_at is null;

-- Same rule as before: future pending requests to me + unread messages from others.
create function chats_badge() returns int
language sql stable security definer set search_path = public as $$
  select (
    (select count(*) from train_requests
     where to_user = (select auth.uid()) and status = 'pending' and proposed_at > now())
    +
    (select count(*) from messages x
     join matches m on m.id = x.match_id
     where (m.user_a = (select auth.uid()) or m.user_b = (select auth.uid()))
       and x.sender_id <> (select auth.uid())
       and x.read_at is null)
  )::int;
$$;

revoke execute on function chats_badge() from public, anon;
grant execute on function chats_badge() to authenticated;
