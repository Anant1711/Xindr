"use server";

import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import {
  feedbackSchema,
  profileInputSchema,
  type ProfileInput,
} from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Please try again.";

export async function createProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const parsed = profileInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Some details are missing or invalid." };

  const { supabase, userId, hasProfile } = await getAuthState();
  if (!userId)
    return { ok: false, error: "Your session ended. Please sign in again." };
  if (hasProfile) redirect("/nearby");

  const p = parsed.data;
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    first_name: p.firstName,
    last_initial: p.lastInitial,
    gender: p.gender,
    level: p.level,
    area_id: p.areaId,
    gym_id: p.gymId,
    time_of_day: p.timeOfDay,
    training_days: p.trainingDays,
    focus: p.focus,
    show_me: p.showMe,
    women_only_visibility: p.gender === "man" ? false : p.womenOnlyVisibility,
    confirmed_18_at: new Date().toISOString(),
  });
  // 23505: the profile already exists (e.g. a double tap); treat as done.
  if (error && error.code !== "23505") return { ok: false, error: GENERIC };

  redirect("/nearby");
}

export async function requestArea(message: string): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse({ message });
  if (!parsed.success) return { ok: false, error: "Tell us your area." };

  const { supabase, userId } = await getAuthState();
  if (!userId)
    return { ok: false, error: "Your session ended. Please sign in again." };

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    kind: "area_request",
    message: parsed.data.message,
  });
  return error ? { ok: false, error: GENERIC } : { ok: true };
}
