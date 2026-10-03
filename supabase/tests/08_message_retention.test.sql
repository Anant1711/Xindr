-- 0004: messages older than 7 days are purged; housekeeping is scheduled and not user-callable.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local');
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day,
                      training_days, show_me, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', now());
insert into matches (id, user_a, user_b) values
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000');
insert into messages (match_id, sender_id, body) values
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'old'),
  ('99999999-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000', 'edge'),
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'new');
-- The trigger stamps server time on insert; age the fixtures afterwards.
update messages set created_at = now() - interval '8 days' where body = 'old';
update messages set created_at = now() - interval '6 days 23 hours' where body = 'edge';

select purge_old_messages();
select results_eq(
  $$select body from messages where match_id = '99999999-0000-0000-0000-000000000000' order by created_at$$,
  $$values ('edge'::text), ('new'::text)$$,
  'messages older than 7 days are deleted; newer ones stay');
select is((select count(*) from matches where id = '99999999-0000-0000-0000-000000000000'), 1::bigint,
  'the match itself is kept');

select isnt_empty($$select 1 from cron.job where jobname = 'purge-old-messages' and schedule = '15 * * * *'$$,
  'the purge runs hourly');
select isnt_empty($$select 1 from cron.job where jobname = 'expire-requests'$$,
  'request expiry is scheduled');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select throws_ok('select purge_old_messages()', '42501', null, 'users cannot call the purge');

-- A client cannot choose the timestamp or pre-mark a message as read.
insert into messages (match_id, sender_id, body, created_at, read_at) values
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'forged',
   '2099-01-01', '2099-01-01');
reset role;
select ok((select created_at < now() + interval '1 minute' from messages where body = 'forged'),
  'a client-supplied future created_at is replaced with server time');
select is((select read_at from messages where body = 'forged'), null,
  'a client-supplied read_at is cleared');
set local role authenticated;
select throws_ok('select * from cron.job', '42501', null, 'users cannot read or change scheduled jobs');

select * from finish();
rollback;
