-- 0007: chats_badge() = future pending requests to me + unread messages from others.
begin;
select plan(5);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'e@test.local');
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day,
                      training_days, show_me, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', now()),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Eli',    'E', 'other', 'beginner', 1, 'evening', '{5}',     'anyone', now());

-- E asks A (counts); a past pending request does not.
insert into train_requests (from_user, to_user, proposed_at) values
  ('eeeeeeee-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', now() + interval '1 day');
insert into matches (id, user_a, user_b) values
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000');
insert into messages (match_id, sender_id, body) values
  ('99999999-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000', 'one'),
  ('99999999-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000', 'two'),
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'mine');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is(chats_badge(), 3, '1 incoming request + 2 unread messages; my own message does not count');
select is(chats_badge(),
  (select (select count(*) from train_requests where to_user = 'aaaaaaaa-0000-0000-0000-000000000000'
             and status = 'pending' and proposed_at > now())
        + (select coalesce(sum(unread_count), 0) from my_conversations()))::int,
  'matches the old badge formula');

select mark_messages_read('99999999-0000-0000-0000-000000000000');
select is(chats_badge(), 1, 'reading the chat clears its unread messages');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is(chats_badge(), 1, 'C sees only the unread message A sent');

set local role anon;
select throws_ok('select chats_badge()', '42501', null, 'signed-out callers cannot use it');

select * from finish();
rollback;
