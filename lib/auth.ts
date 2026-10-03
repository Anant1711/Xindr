import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const sessionSchema = z.object({
  has_profile: z.boolean(),
  badge: z.number().int(),
});

/**
 * Per-request auth state: who is signed in, whether they have finished onboarding, and
 * the Chats badge. One database call (app_session) serves the layout and the page.
 */
export const getAuthState = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;
  if (!userId)
    return { supabase, userId: null, hasProfile: false, badge: 0 } as const;

  const { data: session } = await supabase.rpc("app_session");
  const parsed = sessionSchema.safeParse(session);
  if (parsed.success && parsed.data.has_profile)
    return {
      supabase,
      userId,
      hasProfile: true,
      badge: parsed.data.badge,
    } as const;

  // A validly signed token can outlive its user (deleted account, reset database).
  // Without a profile, confirm the user still exists before sending them to onboarding.
  const { data: user, error } = await supabase.auth.getUser();
  if (error || user.user?.id !== userId) {
    return { supabase, userId: null, hasProfile: false, badge: 0 } as const;
  }
  return { supabase, userId, hasProfile: false, badge: 0 } as const;
});

/**
 * For server actions: just who is signed in (no database call). The database's own
 * rules (RLS and the RPC checks) decide what the action may do.
 */
export async function getSignedInUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims.sub ?? null };
}

/** For app screens: requires a session and a finished profile. */
export async function requireProfile() {
  const state = await getAuthState();
  if (!state.userId) redirect("/login");
  if (!state.hasProfile) redirect("/onboarding");
  return {
    supabase: state.supabase,
    userId: state.userId,
    badge: state.badge,
  };
}

export function homeFor(state: { userId: string | null; hasProfile: boolean }) {
  if (!state.userId) return "/login";
  return state.hasProfile ? "/nearby" : "/onboarding";
}
