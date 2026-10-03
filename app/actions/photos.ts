"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";
import { PHOTO_BUCKET } from "@/lib/photos/server";

export type PhotoResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Please try again.";
const MAX_PHOTOS = 4;

async function session() {
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function refresh() {
  revalidatePath("/profile");
  revalidatePath("/nearby");
}

const addSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/),
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
  if (!parsed.data.path.startsWith(`${userId}/`))
    return { ok: false, error: GENERIC };

  const { count } = await supabase
    .from("profile_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const position = count ?? 0;

  const { error } =
    position >= MAX_PHOTOS
      ? { error: true }
      : await supabase
          .from("profile_photos")
          .insert({ user_id: userId, position, ...parsed.data });

  if (error) {
    // Don't leave an orphaned file behind.
    await supabase.storage.from(PHOTO_BUCKET).remove([parsed.data.path]);
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
  const { data: path, error } = await supabase.rpc("remove_photo", {
    p_photo: photoId,
  });
  if (error || !path) return { ok: false, error: GENERIC };
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
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
