-- =====================================================================
-- Profile photos (up to 4 per person), visible to exactly the people who may
-- see that profile: same rules as get_buddy_profile (discovery rules incl.
-- women-only, show_me, pause and blocks; or an existing request, no block).
-- Files live in a PRIVATE bucket; others get short-lived signed URLs, which
-- the storage SELECT policy below only allows for permitted viewers.
-- Clients re-encode photos (stripping EXIF/GPS) before upload.
-- =====================================================================

-- Who may view someone's media (mirrors get_buddy_profile's access rule).
create function can_view_media(p_owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_owner = auth.uid()
    or can_see(auth.uid(), p_owner)
    or (
      not is_blocked(auth.uid(), p_owner)
      and exists (
        select 1 from train_requests r
        where (r.from_user = auth.uid() and r.to_user = p_owner)
           or (r.from_user = p_owner and r.to_user = auth.uid())
      )
    )
  );
$$;

create table profile_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  -- "<user id>/<random id>.jpg" in the profile-photos bucket
  path       text not null unique
               check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  position   smallint not null check (position between 0 and 3),
  width      int check (width between 1 and 4096),
  height     int check (height between 1 and 4096),
  created_at timestamptz not null default now(),
  check (split_part(path, '/', 1) = user_id::text),
  -- Max 4 per person (positions 0..3); deferrable so positions can be swapped.
  constraint one_photo_per_position unique (user_id, position) deferrable initially immediate
);
alter table profile_photos enable row level security;

-- Owners manage their own rows directly; everyone else reads through RPCs.
create policy photos_select_own on profile_photos for select to authenticated
  using (user_id = auth.uid());
create policy photos_insert_own on profile_photos for insert to authenticated
  with check (user_id = auth.uid());
create policy photos_delete_own on profile_photos for delete to authenticated
  using (user_id = auth.uid());
revoke update on profile_photos from authenticated;

-- One person's photos, main photo first.
create function profile_photos_of(p_id uuid)
returns table (path text, "position" smallint, width int, height int)
language sql stable security definer set search_path = public as $$
  select ph.path, ph.position, ph.width, ph.height
  from profile_photos ph
  where ph.user_id = p_id and can_view_media(p_id)
  order by ph.position;
$$;

-- Main photos for a list of people (Nearby); people you may not see are skipped.
create function main_photos(p_ids uuid[])
returns table (user_id uuid, path text)
language sql stable security definer set search_path = public as $$
  select ph.user_id, ph.path
  from profile_photos ph
  where ph.user_id = any(p_ids) and ph.position = 0 and can_view_media(ph.user_id);
$$;

-- Make one of your photos the main one; the others keep their order.
create function make_main_photo(p_photo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_pos smallint;
begin
  select position into v_pos from profile_photos where id = p_photo and user_id = auth.uid();
  if not found then raise exception 'photo_not_found'; end if;
  set constraints one_photo_per_position deferred;
  update profile_photos set position = position + 1
    where user_id = auth.uid() and position < v_pos;
  update profile_photos set position = 0 where id = p_photo;
end $$;

-- Remove one of your photos and close the gap; returns the file path to delete.
create function remove_photo(p_photo uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_path text; v_pos smallint;
begin
  delete from profile_photos where id = p_photo and user_id = auth.uid()
    returning path, position into v_path, v_pos;
  if v_path is null then raise exception 'photo_not_found'; end if;
  set constraints one_photo_per_position deferred;
  update profile_photos set position = position - 1
    where user_id = auth.uid() and position > v_pos;
  return v_path;
end $$;

revoke execute on function can_view_media(uuid), profile_photos_of(uuid), main_photos(uuid[]),
  make_main_photo(uuid), remove_photo(uuid) from public, anon, authenticated;
grant execute on function can_view_media(uuid), profile_photos_of(uuid), main_photos(uuid[]),
  make_main_photo(uuid), remove_photo(uuid) to authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 1048576, array['image/jpeg']);

create policy "profile photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profile photos: read if allowed to see the owner" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos'
         and public.can_view_media(((storage.foldername(name))[1])::uuid));

create policy "profile photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Reports ----------
alter type report_reason_t add value if not exists 'inappropriate_photo';
