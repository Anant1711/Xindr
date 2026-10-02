"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";
import {
  aboutYouSchema,
  feedbackSchema,
  SHOW_ME,
  type AboutYouInput,
} from "@/lib/validation";

export type Result = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Please try again.";

async function session() {
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function refreshProfile() {
  revalidatePath("/profile");
  revalidatePath("/nearby");
}

export async function updateDetails(input: AboutYouInput): Promise<Result> {
  const parsed = aboutYouSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Some details are missing or invalid." };
  const { supabase, userId } = await session();
  const p = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: p.firstName,
      last_initial: p.lastInitial,
      gender: p.gender,
      level: p.level,
      area_id: p.areaId,
      gym_id: p.gymId,
      time_of_day: p.timeOfDay,
      training_days: p.trainingDays,
      focus: p.focus,
      // Men cannot hide from men (a DB check); switching to "man" turns it off.
      ...(p.gender === "man" ? { women_only_visibility: false } : {}),
    })
    .eq("id", userId);
  if (error) return { ok: false, error: GENERIC };
  refreshProfile();
  return { ok: true };
}

const preferencesSchema = z.object({
  showMe: z.enum(SHOW_ME),
  womenOnlyVisibility: z.boolean(),
});

export async function updatePreferences(
  input: z.input<typeof preferencesSchema>,
): Promise<Result> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const { supabase, userId } = await session();
  const { data: me } = await supabase
    .from("profiles")
    .select("gender")
    .eq("id", userId)
    .single();
  const { error } = await supabase
    .from("profiles")
    .update({
      show_me: parsed.data.showMe,
      women_only_visibility:
        me?.gender === "man" ? false : parsed.data.womenOnlyVisibility,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: GENERIC };
  refreshProfile();
  return { ok: true };
}

export async function setPaused(paused: boolean): Promise<Result> {
  if (typeof paused !== "boolean") return { ok: false, error: GENERIC };
  const { supabase, userId } = await session();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: !paused })
    .eq("id", userId);
  if (error) return { ok: false, error: GENERIC };
  refreshProfile();
  return { ok: true };
}

export async function unblock(personId: string): Promise<Result> {
  if (!z.uuid().safeParse(personId).success)
    return { ok: false, error: GENERIC };
  const { supabase, userId } = await session();
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", personId);
  if (error) return { ok: false, error: GENERIC };
  revalidatePath("/profile/blocked");
  revalidatePath("/nearby");
  return { ok: true };
}

export async function sendFeedback(message: string): Promise<Result> {
  const parsed = feedbackSchema.safeParse({ message });
  if (!parsed.success)
    return { ok: false, error: "Write a short message first." };
  const { supabase, userId } = await session();
  const { error } = await supabase
    .from("feedback")
    .insert({ user_id: userId, kind: "general", message: parsed.data.message });
  return error ? { ok: false, error: GENERIC } : { ok: true };
}

export async function requestArea(message: string): Promise<Result> {
  const parsed = feedbackSchema.safeParse({ message });
  if (!parsed.success) return { ok: false, error: "Tell us your area." };

  const { supabase, userId } = await session();

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    kind: "area_request",
    message: parsed.data.message,
  });
  return error ? { ok: false, error: GENERIC } : { ok: true };
}
