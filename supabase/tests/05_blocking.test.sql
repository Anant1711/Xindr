-- §9 item 9: blocking.
begin;
select plan(13);

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

-- A and C are matched; E has a pending request to A.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select set_config('test.req', send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day')::text, true);
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select set_config('test.match', respond_to_request(current_setting('test.req')::uuid, true)::text, true);
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select set_config('test.req_e', send_request('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '1 day')::text, true);

-- A blocks both.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select block_user('cccccccc-0000-0000-0000-000000000000');
select block_user('eeeeeeee-0000-0000-0000-000000000000');

select is((select count(*) from nearby_profiles() where id = 'cccccccc-0000-0000-0000-000000000000'), 0::bigint,
  'the blocker no longer sees the blocked person');
select is((select count(*) from blocks), 2::bigint, 'the blocker can list their blocks');
select throws_ok($$select block_user('aaaaaaaa-0000-0000-0000-000000000000')$$, 'P0001', 'invalid_target',
  'you cannot block yourself');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where id = 'aaaaaaaa-0000-0000-0000-000000000000'), 0::bigint,
  'the blocked person no longer sees the blocker');
select is_empty($$select * from get_buddy_profile('aaaaaaaa-0000-0000-0000-000000000000')$$,
  'the blocked person cannot open the blocker by id, despite the old request');
select is((select count(*) from profiles where id = 'aaaaaaaa-0000-0000-0000-000000000000'), 0::bigint,
  'the blocked person cannot read the blocker''s profile row');
select is((select ended_at is not null from matches where id = current_setting('test.match')::uuid), true,
  'blocking ends the active match');
select throws_ok($$select send_request('aaaaaaaa-0000-0000-0000-000000000000', now() + interval '1 day')$$,
  'P0001', 'not_allowed', 'the blocked person cannot send a new request');
select throws_ok(
  $$insert into messages (match_id, sender_id, body)
    values (current_setting('test.match')::uuid, 'cccccccc-0000-0000-0000-000000000000', 'hello?')$$,
  '42501', null, 'the blocked person cannot message in the ended match');
select is((select count(*) from blocks), 0::bigint, 'the blocked person cannot see who blocked them');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select is((select status from train_requests where id = current_setting('test.req_e')::uuid),
  'cancelled'::request_status_t, 'blocking cancels pending requests (shown as a plain cancel)');

-- Unblock
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
delete from blocks where blocked_id = 'cccccccc-0000-0000-0000-000000000000';
select is((select count(*) from nearby_profiles() where id = 'cccccccc-0000-0000-0000-000000000000'), 1::bigint,
  'after unblocking, discovery works again');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
delete from blocks where blocker_id = 'aaaaaaaa-0000-0000-0000-000000000000';
reset role;
select is((select count(*) from blocks), 1::bigint, 'you cannot delete someone else''s block');

select * from finish();
rollback;
