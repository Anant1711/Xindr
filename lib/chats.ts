import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

/** Chats tab badge: incoming pending requests (still in the future) + unread messages. */
export async function getChatsBadge(
  supabase: Client,
  userId: string,
): Promise<number> {
  const nowIso = new Date().toISOString();
  const [incoming, conversations] = await Promise.all([
    supabase
      .from("train_requests")
      .select("id", { count: "exact", head: true })
      .eq("to_user", userId)
      .eq("status", "pending")
      .gt("proposed_at", nowIso),
    supabase.rpc("my_conversations"),
  ]);
  const unread = (conversations.data ?? []).reduce(
    (sum, c) => sum + Number(c.unread_count),
    0,
  );
  return (incoming.count ?? 0) + unread;
}

export async function getChatsOverview(supabase: Client, userId: string) {
  const nowIso = new Date().toISOString();
  const [incoming, outgoing, conversations] = await Promise.all([
    supabase
      .from("train_requests")
      .select(
        "id, proposed_at, note, person:profiles!train_requests_from_user_fkey(id, first_name, last_initial)",
      )
      .eq("to_user", userId)
      .eq("status", "pending")
      .gt("proposed_at", nowIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("train_requests")
      .select(
        "id, proposed_at, person:profiles!train_requests_to_user_fkey(id, first_name, last_initial)",
      )
      .eq("from_user", userId)
      .eq("status", "pending")
      .gt("proposed_at", nowIso)
      .order("created_at", { ascending: false }),
    supabase.rpc("my_conversations"),
  ]);
  if (incoming.error || outgoing.error || conversations.error) {
    throw new Error("Could not load chats");
  }
  return {
    // A person can be unreadable (e.g. after a block); drop those rows.
    incoming: incoming.data.flatMap((r) =>
      r.person ? [{ ...r, person: r.person }] : [],
    ),
    outgoing: outgoing.data.flatMap((r) =>
      r.person ? [{ ...r, person: r.person }] : [],
    ),
    conversations: conversations.data,
  };
}
