import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Per-request auth state: who is signed in and whether they have finished onboarding. */
export const getAuthState = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;
  if (!userId) return { supabase, userId: null, hasProfile: false } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profile) return { supabase, userId, hasProfile: true } as const;

  // A validly signed token can outlive its user (deleted account, reset database).
  // Without a profile, confirm the user still exists before sending them to onboarding.
  const { data: user, error } = await supabase.auth.getUser();
  if (error || user.user?.id !== userId) {
    return { supabase, userId: null, hasProfile: false } as const;
  }
  return { supabase, userId, hasProfile: false } as const;
});

/** For app screens: requires a session and a finished profile. */
export async function requireProfile() {
  const state = await getAuthState();
  if (!state.userId) redirect("/login");
  if (!state.hasProfile) redirect("/onboarding");
  return { supabase: state.supabase, userId: state.userId };
}

export function homeFor(state: { userId: string | null; hasProfile: boolean }) {
  if (!state.userId) return "/login";
  return state.hasProfile ? "/nearby" : "/onboarding";
}
