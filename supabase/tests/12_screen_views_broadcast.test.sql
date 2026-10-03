-- 0009-0011: screen views respect visibility; live events go only to the people involved.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local');
insert into profiles (id, first_name, last_initial, last_name, gender, level, area_id, time_of_day,
                      training_days, show_me, women_only_visibility, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'Apte',  'woman', 'beginner', 1, 'evening', '{0,2,4}', 'anyone', false, now()),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'Bina',   'B', 'Bose',  'woman', 'beginner', 1, 'evening', '{0,1}',   'anyone', true,  now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'Joshi', 'man',   'beginner', 2, 'evening', '{0,2}',   'anyone', false, now());
insert into matches (id, user_a, user_b) values
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000');

set local role authenticated;

-- Chetan (a man) cannot see Bina (women-only) through any view.
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is(person_view('bbbbbbbb-0000-0000-0000-000000000000'), null,
  'person_view hides women-only profiles from men');
select ok(not exists (select 1 from jsonb_array_elements(nearby_view()->'people') p
                      where p->>'id' = 'bbbbbbbb-0000-0000-0000-000000000000'),
  'nearby_view hides women-only profiles from men');
select is(person_view('aaaaaaaa-0000-0000-0000-000000000000')->>'last_name', 'Apte',
  'a match sees the full surname');
select is(person_view('aaaaaaaa-0000-0000-0000-000000000000')->>'match_id',
  '99999999-0000-0000-0000-000000000000', 'person_view reports the active match');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select is(person_view('bbbbbbbb-0000-0000-0000-000000000000')->>'last_name', null,
  'no surname without a match');
select is((app_session()->>'has_profile')::boolean, true, 'app_session: onboarding done');
select is(thread_view('99999999-0000-0000-0000-000000000000')->>'first_name', 'Chetan',
  'thread_view works for a participant');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000000"}', true);
select is(thread_view('99999999-0000-0000-0000-000000000000'), null,
  'thread_view is empty for anyone else');
select is(jsonb_array_length(chats_view()->'conversations'), 0, 'chats_view lists only my chats');

-- Broadcast: a message reaches both participants' topics and nobody else's.
reset role;
insert into messages (match_id, sender_id, body) values
  ('99999999-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000', 'hi');
select results_eq(
  $$select topic from realtime.messages where event = 'message' and payload->>'body' = 'hi' order by topic$$,
  $$values ('user:aaaaaaaa-0000-0000-0000-000000000000'::text), ('user:cccccccc-0000-0000-0000-000000000000'::text)$$,
  'a new message is broadcast to both participants only');
select isnt_empty(
  $$select 1 from pg_policy where polrelid = 'realtime.messages'::regclass and polname = 'receive own user topic'$$,
  'only the owner can receive a user topic');
select is_empty(
  $$select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and tablename in ('messages', 'matches', 'train_requests')$$,
  'postgres_changes no longer decodes these tables');

select * from finish();
rollback;
