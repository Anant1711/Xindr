"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

const GENERIC = "Something went wrong. Please try again.";
const uuid = z.uuid();

async function session() {
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  return supabase;
}

export async function cancelRequest(
  requestId: string,
  personId: string,
): Promise<ActionResult> {
  if (!uuid.safeParse(requestId).success) return { ok: false, error: GENERIC };
  const supabase = await session();
  const { error } = await supabase.rpc("cancel_request", {
    p_request: requestId,
  });
  revalidatePath(`/people/${personId}`);
  return error ? { ok: false, error: GENERIC } : { ok: true };
}

export async function respondToRequest(
  requestId: string,
  accept: boolean,
  personId: string,
): Promise<ActionResult> {
  if (!uuid.safeParse(requestId).success) return { ok: false, error: GENERIC };
  const supabase = await session();
  const { error } = await supabase.rpc("respond_to_request", {
    p_request: requestId,
    p_accept: accept,
  });
  revalidatePath(`/people/${personId}`);
  if (error) {
    return {
      ok: false,
      error:
        error.message === "request_not_found"
          ? "This request is no longer available."
          : GENERIC,
    };
  }
  return { ok: true };
}
