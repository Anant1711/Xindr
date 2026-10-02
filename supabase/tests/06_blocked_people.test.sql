-- 0002: my_blocked_people() returns only the caller's own blocks, with list fields only.
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

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select block_user('cccccccc-0000-0000-0000-000000000000');

select results_eq(
  $$select id, first_name, last_initial from my_blocked_people()$$,
  $$values ('cccccccc-0000-0000-0000-000000000000'::uuid, 'Chetan'::text, 'C'::text)$$,
  'the blocker sees the person they blocked'
);
select is((select count(*) from profiles where id = 'cccccccc-0000-0000-0000-000000000000'), 0::bigint,
  'the blocked profile row itself stays unreadable');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is_empty('select * from my_blocked_people()', 'the blocked person does not see who blocked them');

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-0000-0000-000000000000"}', true);
select is_empty('select * from my_blocked_people()', 'a third person sees no one else''s blocks');

-- Unblocking (a direct delete of your own block) removes them from the list.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
delete from blocks where blocked_id = 'cccccccc-0000-0000-0000-000000000000';
select is_empty('select * from my_blocked_people()', 'after unblocking the list is empty');

reset role;
set local role anon;
select throws_ok('select * from my_blocked_people()', '42501', null, 'anonymous callers cannot use it');

select * from finish();
rollback;
