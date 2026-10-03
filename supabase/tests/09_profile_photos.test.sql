-- 0005: profile photos follow profile visibility; uploads only to your own folder; max 4.
begin;
select plan(18);

-- A: woman, women-only. C: man. D: woman. E: other.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.local'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.local'),
  ('dddddddd-0000-0000-0000-000000000000', 'd@test.local');
insert into profiles (id, first_name, last_initial, gender, level, area_id, time_of_day,
                      training_days, show_me, women_only_visibility, confirmed_18_at) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'Asha',   'A', 'woman', 'beginner', 1, 'evening', '{0}', 'anyone', true,  now()),
  ('cccccccc-0000-0000-0000-000000000000', 'Chetan', 'C', 'man',   'beginner', 1, 'evening', '{0}', 'anyone', false, now()),
  ('dddddddd-0000-0000-0000-000000000000', 'Dia',    'D', 'woman', 'beginner', 1, 'evening', '{0}', 'anyone', false, now());

insert into profile_photos (id, user_id, path, thumb_path, position) values
  ('a1111111-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000',
   'aaaaaaaa-0000-0000-0000-000000000000/11111111-0000-0000-0000-000000000000.jpg', null, 0),
  ('a2222222-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000',
   'aaaaaaaa-0000-0000-0000-000000000000/22222222-0000-0000-0000-000000000000.jpg',
   'aaaaaaaa-0000-0000-0000-000000000000/22222222-0000-0000-0000-000000000000.t.jpg', 1),
  ('d1111111-0000-0000-0000-000000000000', 'dddddddd-0000-0000-0000-000000000000',
   'dddddddd-0000-0000-0000-000000000000/11111111-0000-0000-0000-000000000000.jpg', null, 0);
insert into storage.objects (bucket_id, name) values
  ('profile-photos', 'aaaaaaaa-0000-0000-0000-000000000000/11111111-0000-0000-0000-000000000000.jpg');

set local role authenticated;

-- Owner rules
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select lives_ok($$insert into profile_photos (user_id, path, position) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000/33333333-0000-0000-0000-000000000000.jpg', 2)$$,
  'you can add a photo in your own folder');
select throws_ok($$insert into profile_photos (user_id, path, position) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000/44444444-0000-0000-0000-000000000000.jpg', 3)$$,
  '23514', null, 'a path in someone else''s folder is rejected');
select throws_ok($$insert into profile_photos (user_id, path, position) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000000/55555555-0000-0000-0000-000000000000.jpg', 4)$$,
  '23514', null, 'a fifth photo is rejected');
select throws_ok($$insert into profile_photos (user_id, path, position) values
  ('cccccccc-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000000/66666666-0000-0000-0000-000000000000.jpg', 0)$$,
  '42501', null, 'you cannot add a photo as someone else');
select throws_ok($$update profile_photos set position = 3$$, '42501', null, 'direct updates are refused');

-- Visibility follows the profile rules
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000000"}', true);
select is_empty($$select * from profile_photos_of('aaaaaaaa-0000-0000-0000-000000000000')$$,
  'a man cannot see a women-only profile''s photos');
select results_eq($$select user_id from main_photos(array['aaaaaaaa-0000-0000-0000-000000000000','dddddddd-0000-0000-0000-000000000000']::uuid[])$$,
  $$values ('dddddddd-0000-0000-0000-000000000000'::uuid)$$,
  'main_photos skips people you may not see');
select is((select count(*) from storage.objects where name like 'aaaaaaaa-%'), 0::bigint,
  'a man cannot read a women-only profile''s photo file');
select throws_ok($$insert into storage.objects (bucket_id, name) values
  ('profile-photos', 'aaaaaaaa-0000-0000-0000-000000000000/77777777-0000-0000-0000-000000000000.jpg')$$,
  '42501', null, 'you cannot upload into someone else''s folder');
select lives_ok($$insert into storage.objects (bucket_id, name) values
  ('profile-photos', 'cccccccc-0000-0000-0000-000000000000/88888888-0000-0000-0000-000000000000.jpg')$$,
  'you can upload into your own folder');

select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000000"}', true);
select results_eq($$select position from profile_photos_of('aaaaaaaa-0000-0000-0000-000000000000')$$,
  $$values (0::smallint), (1::smallint), (2::smallint)$$,
  'a woman sees a women-only profile''s photos, main first');
select is((select count(*) from profile_photos where user_id = 'aaaaaaaa-0000-0000-0000-000000000000'), 0::bigint,
  'other people''s photo rows are not directly readable');
select is((select count(*) from storage.objects where name like 'aaaaaaaa-%'), 1::bigint,
  'a permitted viewer can read the photo file');
select throws_ok($$select make_main_photo('a2222222-0000-0000-0000-000000000000')$$,
  'P0001', 'photo_not_found', 'you cannot reorder someone else''s photos');

-- Reordering and removal (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000000"}', true);
select make_main_photo('a2222222-0000-0000-0000-000000000000');
select results_eq($$select id from profile_photos where user_id = 'aaaaaaaa-0000-0000-0000-000000000000' and position < 2 order by position$$,
  $$values ('a2222222-0000-0000-0000-000000000000'::uuid), ('a1111111-0000-0000-0000-000000000000'::uuid)$$,
  'make_main_photo moves a photo to the front and keeps the rest in order');
select is(remove_photo('a2222222-0000-0000-0000-000000000000'),
  array['aaaaaaaa-0000-0000-0000-000000000000/22222222-0000-0000-0000-000000000000.jpg',
        'aaaaaaaa-0000-0000-0000-000000000000/22222222-0000-0000-0000-000000000000.t.jpg'],
  'remove_photo returns the photo and thumbnail files to delete');
select results_eq($$select position from profile_photos where user_id = 'aaaaaaaa-0000-0000-0000-000000000000' order by position$$,
  $$values (0::smallint), (1::smallint)$$,
  'positions close the gap after a removal');

-- A block hides photos again
select block_user('dddddddd-0000-0000-0000-000000000000');
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000000"}', true);
select is_empty($$select * from profile_photos_of('aaaaaaaa-0000-0000-0000-000000000000')$$,
  'after a block the photos are hidden');

select * from finish();
rollback;
