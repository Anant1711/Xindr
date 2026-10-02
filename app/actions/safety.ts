"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Please try again.";
const uuid = z.uuid();

async function session() {
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  return supabase;
}

export async function blockUser(personId: string): Promise<ActionResult> {
  if (!uuid.safeParse(personId).success) return { ok: false, error: GENERIC };
  const supabase = await session();
  const { error } = await supabase.rpc("block_user", { p_target: personId });
  if (error) return { ok: false, error: GENERIC };
  revalidatePath("/nearby");
  redirect("/nearby");
}

export async function reportUser(input: {
  reportedId: string;
  reason: string;
  details: string;
}): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a reason." };
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reported_id: parsed.data.reportedId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });
  return error ? { ok: false, error: GENERIC } : { ok: true };
}
