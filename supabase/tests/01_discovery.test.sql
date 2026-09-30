-- §9 items 1, 2, 3, 10: discovery visibility, show_me, level filter, shared_days, probing.
begin;
select plan(19);

-- Fixture users (A..F). Hex-only ids so they are valid uuids.
--   A woman, anyone,  beginner, area 1, gym G, evening {0,2,4}
--   B woman, anyone,  women_only_visibility = true
--   C man,   anyone,  beginner, area 2, gym G, evening {0,2}
--   D man,   women,   pro, morning {0,2,4}
--   E other, anyone
--   F woman, men
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local'),
  ('dddddddd-0000-0000-0000-000000000000', 'd@test.local'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'e@test.local'),
  ('ffffffff-0000-0000-0000-000000000000', 'f@test.local');
insert into gyms (id, name, area_id) values ('99999999-0000-0000-0000-000000000000', 'Test Gym', 1);
insert into profiles (id, first_name, last_initial, gender, level, area_id, gym_id, time_of_day,
                      training_days, show_me, women_only_visibility, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner',     1, '99999999-0000-0000-0000-000000000000', 'evening', '{0,2,4}', 'anyone', false, now()),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Bina',   'B', 'woman', 'intermediate', 1, null, 'evening', '{0,1}',   'anyone', true,  now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner',     2, '99999999-0000-0000-0000-000000000000', 'evening', '{0,2}',   'anyone', false, now()),
  ('dddddddd-0000-0000-0000-000000000000', 'Dev',    'D', 'man',   'pro',          2, null, 'morning', '{0,2,4}', 'women',  false, now()),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Eli',    'E', 'other', 'beginner',     1, null, 'evening', '{5}',     'anyone', false, now()),
  ('ffffffff-0000-0000-0000-000000000000', 'Fara',   'F', 'woman', 'pro',          3, null, 'morning', '{6}',     'men',    false, now());

set local role authenticated;

-- 1. Women-only visibility
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where id = 'bbbbbbbb-0000-0000-0000-000000000000'), 0::bigint,
  'a man cannot discover a women-only profile');
select is_empty($$select * from get_buddy_profile('bbbbbbbb-0000-0000-0000-000000000000')$$,
  'a man cannot open a women-only profile by id');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where id = 'bbbbbbbb-0000-0000-0000-000000000000'), 0::bigint,
  'a person of gender "other" cannot discover a women-only profile');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where id = 'bbbbbbbb-0000-0000-0000-000000000000'), 1::bigint,
  'a woman can discover a women-only profile');
select isnt_empty($$select * from get_buddy_profile('bbbbbbbb-0000-0000-0000-000000000000')$$,
  'a woman can open a women-only profile by id');
select is((select count(*) from nearby_profiles() where id = 'aaaaaaaa-0000-0000-0000-000000000000'), 0::bigint,
  'you never see yourself in nearby');

-- 2. show_me filters
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where gender <> 'woman'), 0::bigint,
  'show_me = women hides men and other');
select is((select count(*) from nearby_profiles() where id = 'aaaaaaaa-0000-0000-0000-000000000000'), 1::bigint,
  'show_me = women still shows women');

select set_config('request.jwt.claims', '{"sub":"ffffffff-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where gender <> 'man'), 0::bigint,
  'show_me = men hides women and other');
select is((select count(*) from nearby_profiles() where id = 'cccccccc-0000-0000-0000-000000000000'), 1::bigint,
  'show_me = men still shows men');

-- 3. Level filter and shared_days
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select ok((select count(*) from nearby_profiles('beginner')) > 0, 'level filter returns matching people');
select is((select count(*) from nearby_profiles('beginner') where level <> 'beginner'), 0::bigint,
  'level filter excludes other levels');
select is(shared_days('aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000'),
  '{0,2}'::smallint[], 'shared_days intersects days when time of day matches');
select is(shared_days('aaaaaaaa-0000-0000-0000-000000000000', 'dddddddd-0000-0000-0000-000000000000'),
  '{}'::smallint[], 'shared_days is empty when time of day differs');
select results_eq(
  $$select same_gym, shared_days from nearby_profiles() where id = 'cccccccc-0000-0000-0000-000000000000'$$,
  $$values (true, '{0,2}'::smallint[])$$,
  'nearby card carries same_gym and shared_days');

-- 10. Probing other people's relationships
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is(can_see('aaaaaaaa-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000'), false,
  'can_see is false when probed with someone else as viewer');
select is(shared_days('aaaaaaaa-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000000'),
  '{}'::smallint[], 'shared_days is empty when probed for two other people');
select throws_ok('select expire_stale_requests()', '42501', null,
  'expire_stale_requests is not callable by users');

-- Inactive (paused) profiles disappear from discovery.
reset role;
update profiles set is_active = false where id = 'cccccccc-0000-0000-0000-000000000000';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is((select count(*) from nearby_profiles() where id = 'cccccccc-0000-0000-0000-000000000000'), 0::bigint,
  'a paused profile is hidden from discovery');

select * from finish();
rollback;
