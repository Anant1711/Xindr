import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Relationship =
  | { kind: "none" }
  | { kind: "sent"; requestId: string; proposedAt: string }
  | { kind: "received"; requestId: string; proposedAt: string }
  | { kind: "matched"; matchId: string };

/** The viewer's current relationship with another person: active match, else the latest pending request. */
export async function getRelationship(
  supabase: SupabaseClient<Database>,
  me: string,
  them: string,
): Promise<Relationship> {
  const [userA, userB] = me < them ? [me, them] : [them, me];
  const [match, request] = await Promise.all([
    supabase
      .from("matches")
      .select("id")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .is("ended_at", null)
      .maybeSingle(),
    supabase
      .from("train_requests")
      .select("id, from_user, proposed_at")
      .eq("status", "pending")
      .or(
        `and(from_user.eq.${me},to_user.eq.${them}),and(from_user.eq.${them},to_user.eq.${me})`,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (match.error || request.error)
    throw new Error("Could not load relationship");

  if (match.data) return { kind: "matched", matchId: match.data.id };
  if (request.data) {
    const { id, from_user, proposed_at } = request.data;
    return {
      kind: from_user === me ? "sent" : "received",
      requestId: id,
      proposedAt: proposed_at,
    };
  }
  return { kind: "none" };
}
