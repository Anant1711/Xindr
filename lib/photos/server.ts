import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const PHOTO_BUCKET = "profile-photos";
const SIGNED_URL_SECONDS = 60 * 60;
// Reuse a signed URL until it has this long left, so it never expires while on screen.
const REUSE_MARGIN_MS = 15 * 60 * 1000;
const MAX_CACHED = 5000;

// Signed URLs carry a fresh token each time, so re-signing on every render gave each photo
// a new address and the browser downloaded it again. Reusing the URL lets the browser
// cache work and skips the storage call. Keyed by viewer: a URL is only ever handed back
// to the person whose permission check produced it. Per server instance, best effort.
const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Short-lived URLs for private photos. Created with the viewer's own session, so the
 * storage SELECT policy (can_view_media) decides; paths the viewer may not see get no URL.
 */
export async function signedPhotoUrls(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  paths: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const now = Date.now();
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const hit = cache.get(`${viewerId}|${path}`);
    if (hit && hit.expiresAt - now > REUSE_MARGIN_MS) urls.set(path, hit.url);
    else missing.push(path);
  }
  if (missing.length === 0) return urls;

  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(missing, SIGNED_URL_SECONDS);
  const expiresAt = now + SIGNED_URL_SECONDS * 1000;
  for (const item of data ?? []) {
    if (!item.path || !item.signedUrl || item.error) continue;
    urls.set(item.path, item.signedUrl);
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
    cache.set(`${viewerId}|${item.path}`, { url: item.signedUrl, expiresAt });
  }
  return urls;
}
