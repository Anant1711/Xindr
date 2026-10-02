-- 0003: full last name is visible only to yourself and to matched people without a block.
begin;
select plan(11);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local'),
  ('eeeeeeee-0000-0000-0000-000000000000', 'e@test.local');
insert into profiles (id, first_name, last_initial, last_name, gender, level, area_id, time_of_day,
                      training_days, show_me, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'K', 'Kulkarni', 'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'S', 'Shah',     'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', now()),
  ('eeeeeeee-0000-0000-0000-000000000000', 'Eli',    'D', 'D''Souza', 'other', 'beginner', 1, 'evening', '{5}',     'anyone', now());

set local role authenticated;

-- Direct reads of the column are refused even for your own row; other columns still work.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select throws_ok('select last_name from profiles', '42501', null, 'last_name cannot be selected directly');
select lives_ok('select id, first_name, last_initial from profiles', 'other columns are still readable');
select is(visible_last_name('aaaaaaaa-0000-0000-0000-000000000000'), 'Kulkarni', 'you see your own last name');
select is(visible_last_name('cccccccc-0000-0000-0000-000000000000'), null, 'a stranger''s last name is hidden');

-- A pending request is not enough.
select set_config('test.req', send_request('cccccccc-0000-0000-0000-000000000000', now() + interval '1 day')::text, true);
select is(visible_last_name('cccccccc-0000-0000-0000-000000000000'), null, 'a pending request does not reveal it');

-- Accepting reveals it to both sides.
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select respond_to_request(current_setting('test.req')::uuid, true);
select is(visible_last_name('aaaaaaaa-0000-0000-0000-000000000000'), 'Kulkarni', 'the match sees the full last name');
select results_eq('select other_id, last_name from my_match_last_names()',
  $$values ('aaaaaaaa-0000-0000-0000-000000000000'::uuid, 'Kulkarni'::text)$$,
  'my_match_last_names lists matched people');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select is(visible_last_name('aaaaaaaa-0000-0000-0000-000000000000'), null, 'a third person cannot probe it');
select is_empty('select * from my_match_last_names()', 'a third person has no matched names');

-- A block hides it again (the match is ended by the block).
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select block_user('cccccccc-0000-0000-0000-000000000000');
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is(visible_last_name('aaaaaaaa-0000-0000-0000-000000000000'), null, 'after a block it is hidden');

-- Non-Latin initials are allowed now.
reset role;
select lives_ok($$update profiles set last_initial = 'Ç' where id = 'eeeeeeee-0000-0000-0000-000000000000'$$,
  'a non-Latin letter is a valid initial');

select * from finish();
rollback;
