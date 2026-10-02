"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";
import { LIMITS } from "@/lib/constants";

const GENERIC = "Something went wrong. Please try again.";
const uuid = z.uuid();

export type SendError =
  "duplicate" | "too_many" | "time_in_past" | "unavailable" | "generic";

export type SendResult =
  { ok: true } | { ok: false; reason: SendError; error: string };
export type RespondResult =
  { ok: true; matchId: string | null } | { ok: false; error: string };
export type CancelResult = { ok: true } | { ok: false; error: string };

async function session() {
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  return supabase;
}

function refresh(personId?: string) {
  revalidatePath("/chats");
  if (personId) revalidatePath(`/people/${personId}`);
}

const sendSchema = z.object({
  personId: uuid,
  proposedAt: z.iso.datetime({ offset: true }),
  note: z.string().max(LIMITS.note),
});

export async function sendRequest(input: {
  personId: string;
  proposedAt: string;
  note: string;
}): Promise<SendResult> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "generic", error: GENERIC };

  const supabase = await session();
  const { personId, proposedAt, note } = parsed.data;
  const { error } = await supabase.rpc("send_request", {
    p_to: personId,
    p_proposed_at: proposedAt,
    p_note: note.trim() || undefined,
  });
  refresh(personId);
  if (!error) return { ok: true };

  if (error.code === "23505") {
    return {
      ok: false,
      reason: "duplicate",
      error: "You already have a pending request with this person.",
    };
  }
  switch (error.message) {
    case "too_many_pending":
      return {
        ok: false,
        reason: "too_many",
        error: "You have too many open requests. Wait for replies first.",
      };
    case "time_in_past":
      return {
        ok: false,
        reason: "time_in_past",
        error: "That time has passed. Pick one of the updated times.",
      };
    case "not_allowed":
    case "already_matched":
      return {
        ok: false,
        reason: "unavailable",
        error: "You can't send a request to this person right now.",
      };
    default:
      return { ok: false, reason: "generic", error: GENERIC };
  }
}

export async function cancelRequest(
  requestId: string,
  personId?: string,
): Promise<CancelResult> {
  if (!uuid.safeParse(requestId).success) return { ok: false, error: GENERIC };
  const supabase = await session();
  const { error } = await supabase.rpc("cancel_request", {
    p_request: requestId,
  });
  refresh(personId);
  return error ? { ok: false, error: GENERIC } : { ok: true };
}

export async function respondToRequest(
  requestId: string,
  accept: boolean,
  personId?: string,
): Promise<RespondResult> {
  if (!uuid.safeParse(requestId).success) return { ok: false, error: GENERIC };
  const supabase = await session();
  const { data, error } = await supabase.rpc("respond_to_request", {
    p_request: requestId,
    p_accept: accept,
  });
  refresh(personId);
  if (error) {
    return {
      ok: false,
      error:
        error.message === "request_not_found" || error.message === "not_allowed"
          ? "This request is no longer available."
          : GENERIC,
    };
  }
  return { ok: true, matchId: data ?? null };
}
