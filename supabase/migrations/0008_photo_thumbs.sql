-- =====================================================================
-- Photo thumbnails. Cards and avatars show photos at 52-300 px but loaded
-- the full 1080 px upload. The browser now also uploads a ~480 px copy
-- ("<user>/<id>.t.jpg"); small places use it, the gallery keeps the full one.
-- Older photos have no thumbnail and fall back to the full image.
-- =====================================================================

alter table profile_photos
  add column thumb_path text unique
    check (thumb_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.t\.jpg$'),
  add constraint thumb_in_own_folder
    check (thumb_path is null or split_part(thumb_path, '/', 1) = user_id::text);

-- Removing a photo now returns every file to delete (photo and thumbnail).
drop function remove_photo(uuid);
create function remove_photo(p_photo uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare v_path text; v_thumb text; v_pos smallint;
begin
  delete from profile_photos where id = p_photo and user_id = auth.uid()
    returning path, thumb_path, position into v_path, v_thumb, v_pos;
  if v_path is null then raise exception 'photo_not_found'; end if;
  set constraints one_photo_per_position deferred;
  update profile_photos set position = position - 1
    where user_id = auth.uid() and position > v_pos;
  return array_remove(array[v_path, v_thumb], null);
end $$;
revoke execute on function remove_photo(uuid) from public, anon;
grant execute on function remove_photo(uuid) to authenticated;
