-- =====================================================================
-- The note sent with a train request becomes the first chat message.
-- Without this the note was only visible on the pending request card and
-- vanished once accepted, leaving the new chat empty.
-- =====================================================================

create function carry_request_note() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r     train_requests;
  v_msg uuid;
begin
  if new.request_id is null then return new; end if;
  select * into r from train_requests where id = new.request_id;
  if r.note is null then return new; end if;

  -- Sent by the requester. The accepter already read it on the request card,
  -- so it starts read (messages_server_fields clears read_at on insert).
  insert into messages (match_id, sender_id, body)
  values (new.id, r.from_user, r.note)
  returning id into v_msg;
  update messages set read_at = now() where id = v_msg;
  return new;
end $$;

revoke execute on function carry_request_note() from public, anon, authenticated;

create trigger carry_request_note after insert on matches
  for each row execute function carry_request_note();

-- Backfill active chats that started from a request with a note and have no messages yet.
insert into messages (match_id, sender_id, body)
select m.id, r.from_user, r.note
from matches m
join train_requests r on r.id = m.request_id
where m.ended_at is null
  and r.note is not null
  and not exists (select 1 from messages x where x.match_id = m.id);
-- Those chats now hold exactly that one message; mark it read like the trigger does.
update messages x set read_at = now()
from matches m join train_requests r on r.id = m.request_id
where x.match_id = m.id and m.ended_at is null and x.sender_id = r.from_user
  and x.body = r.note and x.read_at is null
  and (select count(*) from messages y where y.match_id = m.id) = 1;
