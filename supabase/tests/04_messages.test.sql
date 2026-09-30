-- §9 items 8, 11: messaging access, unread counts, ended matches.
begin;
select plan(14);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'e@test.local');
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day,
                      training_days, show_me, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', now()),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Eli',    'E', 'other', 'beginner', 1, 'evening', '{5}',     'anyone', now());

set local role authenticated;

-- A requests C, C accepts.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select set_config('test.req', send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day')::text, true);
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select set_config('test.match', respond_to_request(current_setting('test.req')::uuid, true)::text, true);

-- 8. Only participants can read or send; no impersonation; no sending after the end.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select lives_ok(
  $$insert into messages (match_id, sender_id, body)
    values (current_setting('test.match')::uuid, 'aaaaaaaa-0000-0000-0000-000000000000', 'Hi, 6:30 works')$$,
  'a participant can send a message');
select lives_ok(
  $$insert into messages (match_id, sender_id, body)
    values (current_setting('test.match')::uuid, 'aaaaaaaa-0000-0000-0000-000000000000', 'See you at the gym')$$,
  'a participant can send another message');
select throws_ok(
  $$insert into messages (match_id, sender_id, body)
    values (current_setting('test.match')::uuid, 'cccccccc-0000-0000-0000-000000000000', 'fake')$$,
  '42501', null, 'you cannot send as someone else');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select is((select count(*) from messages), 0::bigint, 'a non-participant reads no messages');
select throws_ok(
  $$insert into messages (match_id, sender_id, body)
    values (current_setting('test.match')::uuid, 'eeeeeeee-0000-0000-0000-000000000000', 'hello')$$,
  '42501', null, 'a non-participant cannot send into a match');
select is_empty('select * from my_conversations()', 'a non-participant has no conversations');

-- 11. Unread counts and mark_messages_read
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select count(*) from messages), 2::bigint, 'the other participant reads the messages');
select results_eq(
  $$select unread_count, last_body from my_conversations() where match_id = current_setting('test.match')::uuid$$,
  $$values (2::bigint, 'See you at the gym'::text)$$,
  'the recipient sees 2 unread and the latest message');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is((select unread_count from my_conversations()), 0::bigint, 'your own messages are not unread for you');
select mark_messages_read(current_setting('test.match')::uuid);

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select unread_count from my_conversations()), 2::bigint,
  'the sender marking read does not clear the recipient''s unread');
select mark_messages_read(current_setting('test.match')::uuid);
select is((select unread_count from my_conversations()), 0::bigint, 'the recipient marking read clears unread');

-- Ended matches are read-only.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select end_match(current_setting('test.match')::uuid);

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select ended from my_conversations()), true, 'the conversation shows as ended');
select throws_ok(
  $$insert into messages (match_id, sender_id, body)
    values (current_setting('test.match')::uuid, 'cccccccc-0000-0000-0000-000000000000', 'still there?')$$,
  '42501', null, 'no one can send after the match ends');
select is((select count(*) from messages), 2::bigint, 'history stays readable after the match ends');

select * from finish();
rollback;
