"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";
import { messageSchema } from "@/lib/validation";

const uuid = z.uuid();

async function session() {
  const { supabase, userId } = await getAuthState();
  if (!userId) redirect("/login");
  return { supabase, userId };
}

export type SentMessage = { id: string; created_at: string; body: string };

export async function sendMessage(
  matchId: string,
  body: string,
): Promise<{ ok: true; message: SentMessage } | { ok: false; ended: boolean }> {
  const text = messageSchema.safeParse(body);
  if (!uuid.safeParse(matchId).success || !text.success)
    return { ok: false, ended: false };

  const { supabase, userId } = await session();
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: userId, body: text.data })
    .select("id, created_at, body")
    .single();
  if (error) {
    // RLS rejects sends into an ended match; tell the client so it can lock the thread.
    const { data: match } = await supabase
      .from("matches")
      .select("ended_at")
      .eq("id", matchId)
      .maybeSingle();
    return { ok: false, ended: Boolean(match?.ended_at) };
  }
  return { ok: true, message: data };
}

export async function markRead(matchId: string): Promise<void> {
  if (!uuid.safeParse(matchId).success) return;
  const { supabase } = await session();
  await supabase.rpc("mark_messages_read", { p_match: matchId });
}

export async function endConversation(
  matchId: string,
): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(matchId).success) return { ok: false };
  const { supabase } = await session();
  const { error } = await supabase.rpc("end_match", { p_match: matchId });
  revalidatePath("/chats");
  return { ok: !error };
}
