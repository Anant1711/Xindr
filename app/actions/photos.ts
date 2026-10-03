"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSignedInUser } from "@/lib/auth";
import { PHOTO_BUCKET } from "@/lib/photos/server";

export type PhotoResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Please try again.";
const MAX_PHOTOS = 4;

async function session() {
  const { supabase, userId } = await getSignedInUser();
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function refresh() {
  revalidatePath("/profile");
  revalidatePath("/nearby");
}

const addSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/),
  thumbPath: z
    .string()
    .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.t\.jpg$/)
    .nullable(),
  width: z.number().int().min(1).max(4096),
  height: z.number().int().min(1).max(4096),
});

/** Records a photo the browser has just uploaded to the user's own folder. */
export async function addPhoto(
  input: z.input<typeof addSchema>,
): Promise<PhotoResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const { supabase, userId } = await session();
  const { path, thumbPath, width, height } = parsed.data;
  if (
    !path.startsWith(`${userId}/`) ||
    (thumbPath && thumbPath !== path.replace(/\.jpg$/, ".t.jpg"))
  )
    return { ok: false, error: GENERIC };
  const files = thumbPath ? [path, thumbPath] : [path];

  const { count } = await supabase
    .from("profile_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const position = count ?? 0;

  const { error } =
    position >= MAX_PHOTOS
      ? { error: true }
      : await supabase.from("profile_photos").insert({
          user_id: userId,
          position,
          path,
          thumb_path: thumbPath,
          width,
          height,
        });

  if (error) {
    // Don't leave an orphaned file behind.
    await supabase.storage.from(PHOTO_BUCKET).remove(files);
    return {
      ok: false,
      error:
        position >= MAX_PHOTOS
          ? `You can add up to ${MAX_PHOTOS} photos.`
          : GENERIC,
    };
  }
  refresh();
  return { ok: true };
}

export async function removePhoto(photoId: string): Promise<PhotoResult> {
  if (!z.uuid().safeParse(photoId).success)
    return { ok: false, error: GENERIC };
  const { supabase } = await session();
  const { data: paths, error } = await supabase.rpc("remove_photo", {
    p_photo: photoId,
  });
  if (error || !paths) return { ok: false, error: GENERIC };
  await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  refresh();
  return { ok: true };
}

export async function makeMainPhoto(photoId: string): Promise<PhotoResult> {
  if (!z.uuid().safeParse(photoId).success)
    return { ok: false, error: GENERIC };
  const { supabase } = await session();
  const { error } = await supabase.rpc("make_main_photo", { p_photo: photoId });
  if (error) return { ok: false, error: GENERIC };
  refresh();
  return { ok: true };
}
