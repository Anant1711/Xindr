"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSignedInUser } from "@/lib/auth";

const uuid = z.uuid();

async function session() {
  const { supabase, userId } = await getSignedInUser();
  if (!userId) redirect("/login");
  return { supabase, userId };
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
