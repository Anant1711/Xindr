-- §9 items 4, 5: direct table reads and writes.
begin;
select plan(17);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local');
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day,
                      training_days, show_me, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', now()),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Bina',   'B', 'woman', 'beginner', 1, 'evening', '{0,1}',   'anyone', now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', now());

set local role authenticated;

-- 4. Direct select on profiles
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select count(*) from profiles), 1::bigint, 'with no connections you can read only your own profile');
select is((select id from profiles), 'cccccccc-0000-0000-0000-000000000000'::uuid, 'the one readable row is your own');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select lives_ok($$select send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day')$$,
  'A sends C a request');
select is((select count(*) from profiles), 2::bigint, 'after a request the sender can read the recipient');
select is((select count(*) from profiles where id = 'bbbbbbbb-0000-0000-0000-000000000000'), 0::bigint,
  'unconnected profiles stay unreadable');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select count(*) from profiles), 2::bigint, 'after a request the recipient can read the sender');

-- 5. Writes that must go through RPCs, and write-only tables
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select throws_ok(
  $$insert into train_requests (from_user, to_user, proposed_at)
    values ('aaaaaaaa-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000', now() + interval '1 day')$$,
  '42501', null, 'direct insert into train_requests fails');
select throws_ok($$update train_requests set status = 'accepted'$$, '42501', null,
  'direct update of train_requests fails');
select throws_ok(
  $$insert into matches (user_a, user_b)
    values ('aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000')$$,
  '42501', null, 'direct insert into matches fails');
select throws_ok(
  $$insert into blocks (blocker_id, blocked_id)
    values ('aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000')$$,
  '42501', null, 'direct insert into blocks fails');
select throws_ok($$update messages set body = 'edited'$$, '42501', null, 'direct update of messages fails');
select throws_ok($$delete from messages$$, '42501', null, 'direct delete of messages fails');
select throws_ok($$select * from reports$$, '42501', null, 'reports are not readable by users');
select throws_ok($$select * from feedback$$, '42501', null, 'feedback is not readable by users');
select lives_ok(
  $$insert into reports (reporter_id, reported_id, reason)
    values ('aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000', 'other')$$,
  'you can file a report as yourself');
select throws_ok(
  $$insert into reports (reporter_id, reported_id, reason)
    values ('cccccccc-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000', 'other')$$,
  '42501', null, 'you cannot file a report as someone else');
select lives_ok(
  $$insert into feedback (user_id, kind, message)
    values ('aaaaaaaa-0000-0000-0000-000000000000', 'area_request', 'Ravet please')$$,
  'you can send feedback as yourself');

select * from finish();
rollback;
