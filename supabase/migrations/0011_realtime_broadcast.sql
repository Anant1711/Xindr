-- =====================================================================
-- Live updates over per-user broadcast instead of postgres_changes.
-- postgres_changes decodes every change to the published tables and runs
-- an RLS check per change per listener, which is the part of Realtime that
-- scales worst. Now triggers send each event only to the people involved,
-- on a private topic "user:<id>" that only that user can join.
-- =====================================================================

-- Only you can receive your own topic.
create policy "receive own user topic" on realtime.messages
  for select to authenticated
  using (realtime.topic() = 'user:' || (select auth.uid())::text
         and extension = 'broadcast');

create function broadcast_to(p_users uuid[], p_event text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  foreach u in array p_users loop
    perform realtime.send(p_payload, p_event, 'user:' || u::text, true);
  end loop;
end $$;
revoke execute on function broadcast_to(uuid[], text, jsonb) from public, anon, authenticated;

create function broadcast_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  select * into m from matches where id = new.match_id;
  perform broadcast_to(array[m.user_a, m.user_b], 'message', jsonb_build_object(
    'id', new.id, 'match_id', new.match_id, 'sender_id', new.sender_id,
    'body', new.body, 'created_at', new.created_at));
  return null;
end $$;

create function broadcast_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform broadcast_to(array[new.from_user, new.to_user], 'request',
    jsonb_build_object('id', new.id, 'status', new.status));
  return null;
end $$;

create function broadcast_match() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform broadcast_to(array[new.user_a, new.user_b], 'match',
    jsonb_build_object('id', new.id, 'ended', new.ended_at is not null));
  return null;
end $$;

revoke execute on function broadcast_message(), broadcast_request(), broadcast_match()
  from public, anon, authenticated;

create trigger broadcast_message after insert on messages
  for each row execute function broadcast_message();
create trigger broadcast_request after insert or update of status on train_requests
  for each row execute function broadcast_request();
create trigger broadcast_match after insert or update of ended_at on matches
  for each row execute function broadcast_match();

-- Nothing listens to postgres_changes any more; stop decoding these tables.
alter publication supabase_realtime drop table train_requests, matches, messages;
