-- 0006: an accepted request's note becomes the first chat message, sent by the requester.
begin;
select plan(6);

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

-- A asks C with a note; E asks C without one.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day', 'Leg day at 6?');
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select respond_to_request(
  (select id from train_requests where from_user = 'aaaaaaaa-0000-0000-0000-000000000000'), true);
select respond_to_request(
  (select id from train_requests where from_user = 'eeeeeeee-0000-0000-0000-000000000000'), true);

select results_eq(
  $$select sender_id, body from messages m join matches x on x.id = m.match_id
    where 'aaaaaaaa-0000-0000-0000-000000000000' in (x.user_a, x.user_b)$$,
  $$values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid, 'Leg day at 6?'::text)$$,
  'the accepter sees the note as the first message, from the requester');
select isnt((select read_at from messages where body = 'Leg day at 6?'), null,
  'the note starts read: the accepter already saw it on the request');
select is(
  (select count(*) from messages m join matches x on x.id = m.match_id
   where 'eeeeeeee-0000-0000-0000-000000000000' in (x.user_a, x.user_b)),
  0::bigint, 'a request without a note opens an empty chat');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is((select body from messages limit 1), 'Leg day at 6?', 'the requester sees it too');
select is((select count(*) from messages where body = 'Leg day at 6?'), 1::bigint,
  'and only in their own chat (RLS)');

select throws_ok('select carry_request_note()', '42501', null, 'users cannot call the trigger function');

select * from finish();
rollback;
