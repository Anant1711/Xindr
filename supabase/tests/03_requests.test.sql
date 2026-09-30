-- §9 items 6, 7: send_request rules and responding.
begin;
select plan(18);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'e@test.local');
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day,
                      training_days, show_me, women_only_visibility, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', false, now()),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Bina',   'B', 'woman', 'beginner', 1, 'evening', '{0,1}',   'anyone', true,  now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', false, now()),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Eli',    'E', 'other', 'beginner', 1, 'evening', '{5}',     'anyone', false, now());

-- Eleven extra discoverable people for the pending-request limit.
insert into auth.users (id, email)
select format('00000000-0000-0000-0000-%s', lpad(n::text, 12, '0'))::uuid, format('x%s@test.local', n)
from generate_series(1, 11) n;
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day, training_days, confirmed_18_at)
select format('00000000-0000-0000-0000-%s', lpad(n::text, 12, '0'))::uuid, 'Extra', 'X', 'woman', 'beginner', 1, 'evening', '{0}', now()
from generate_series(1, 11) n;

set local role authenticated;

-- 6. send_request rejections
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select throws_ok($$select send_request('bbbbbbbb-0000-0000-0000-000000000000', now() + interval '1 day')$$,
  'P0001', 'not_allowed', 'cannot request someone hidden from you');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select throws_ok($$select send_request('cccccccc-0000-0000-0000-000000000000', now() - interval '1 hour')$$,
  'P0001', 'time_in_past', 'cannot propose a time in the past');
select lives_ok($$select send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day', '  ')$$,
  'A requests C');
select throws_ok($$select send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '2 days')$$,
  '23505', null, 'a duplicate pending request fails');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select throws_ok($$select send_request('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '2 days')$$,
  '23505', null, 'a reverse-direction duplicate pending request fails');

-- 7. Responding
reset role;
select set_config('test.req',
  (select id::text from train_requests where from_user = 'aaaaaaaa-0000-0000-0000-000000000000'
                                         and to_user = 'cccccccc-0000-0000-0000-000000000000'), true);
select is((select note from train_requests where id = current_setting('test.req')::uuid), null,
  'a blank note is stored as null');
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select throws_ok($$select respond_to_request(current_setting('test.req')::uuid, true)$$,
  'P0001', 'request_not_found', 'the sender cannot accept their own request');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select throws_ok($$select respond_to_request(current_setting('test.req')::uuid, true)$$,
  'P0001', 'request_not_found', 'a stranger cannot respond to a request');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select ok(respond_to_request(current_setting('test.req')::uuid, true) is not null,
  'the recipient accepts and gets a match id');
select is((select count(*) from matches where ended_at is null), 1::bigint, 'accepting creates exactly one active match');
select is((select status from train_requests where id = current_setting('test.req')::uuid), 'accepted'::request_status_t,
  'the request is marked accepted');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select throws_ok($$select send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '2 days')$$,
  'P0001', 'already_matched', 'cannot request someone you are already matched with');

-- Decline and cancel
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select set_config('test.req2', send_request('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '1 day')::text, true);
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is(respond_to_request(current_setting('test.req2')::uuid, false), null, 'declining returns no match');
select is((select count(*) from matches where 'eeeeeeee-0000-0000-0000-000000000000' in (user_a, user_b)), 0::bigint,
  'declining creates no match');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select set_config('test.req3', send_request('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '1 day')::text, true);
select cancel_request(current_setting('test.req3')::uuid);
select is((select status from train_requests where id = current_setting('test.req3')::uuid), 'cancelled'::request_status_t,
  'the sender can cancel a pending request');

-- Pending limit: A has no pending requests now; ten are allowed, the eleventh is not.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select lives_ok(
  $$select send_request(format('00000000-0000-0000-0000-%s', lpad(n::text, 12, '0'))::uuid, now() + interval '1 day')
    from generate_series(1, 10) n$$,
  'ten pending outgoing requests are allowed');
select throws_ok(
  $$select send_request('00000000-0000-0000-0000-000000000011', now() + interval '1 day')$$,
  'P0001', 'too_many_pending', 'the eleventh pending outgoing request is rejected');

-- Housekeeping expires pending requests whose time has passed.
reset role;
update train_requests set proposed_at = now() - interval '1 minute'
where to_user = '00000000-0000-0000-0000-000000000001';
select expire_stale_requests();
select is((select status from train_requests where to_user = '00000000-0000-0000-0000-000000000001'),
  'expired'::request_status_t, 'expire_stale_requests expires past pending requests');

select * from finish();
rollback;
