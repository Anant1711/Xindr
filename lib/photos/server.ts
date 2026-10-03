import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const PHOTO_BUCKET = "profile-photos";
const SIGNED_URL_SECONDS = 60 * 60;

/**
 * Short-lived URLs for private photos. Created with the viewer's own session, so the
 * storage SELECT policy (can_view_media) decides; paths the viewer may not see get no URL.
 */
export async function signedPhotoUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error)
      urls.set(item.path, item.signedUrl);
  }
  return urls;
}
