import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { buddyCardsSchema } from "@/lib/buddy";
import { displayName, slotLabel } from "@/lib/format";
import { Thread } from "./Thread";

export const metadata = { title: "Chat" };

const HISTORY_LIMIT = 300;

export default async function ThreadPage(props: PageProps<"/chats/[matchId]">) {
  const { matchId } = await props.params;
  if (!z.uuid().safeParse(matchId).success) notFound();

  const { supabase, userId } = await requireProfile();

  // RLS: only the two participants can read the match and its messages.
  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, user_a, user_b, ended_at, request:train_requests!matches_request_id_fkey(proposed_at)",
    )
    .eq("id", matchId)
    .maybeSingle();
  if (!match) notFound();

  const otherId = match.user_a === userId ? match.user_b : match.user_a;

  const [conversation, history, other, me] = await Promise.all([
    // Names come from my_conversations, which still works after a block ends the chat.
    supabase
      .rpc("my_conversations")
      .then((r) => r.data?.find((c) => c.match_id === matchId) ?? null),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase.rpc("get_buddy_profile", { p_id: otherId }),
    supabase
      .from("profiles")
      .select("area:areas(name), gym:gyms(name)")
      .eq("id", userId)
      .single(),
  ]);
  if (!conversation || history.error) notFound();

  const card = other.data ? buddyCardsSchema.parse(other.data)[0] : undefined;
  const place =
    card?.gym_name ?? me.data?.gym?.name ?? me.data?.area.name ?? null;
  const proposedAt = match.request?.proposed_at;
  const plan = proposedAt
    ? [slotLabel(new Date(proposedAt)), place].filter(Boolean).join(" · ")
    : null;

  return (
    <Thread
      matchId={matchId}
      meId={userId}
      other={{
        id: otherId,
        firstName: conversation.other_first_name,
        lastInitial: conversation.other_last_initial,
        name: displayName(
          conversation.other_first_name,
          conversation.other_last_initial,
        ),
      }}
      plan={plan}
      ended={Boolean(match.ended_at)}
      initialMessages={history.data.reverse()}
    />
  );
}
