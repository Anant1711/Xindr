import { notFound } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { slotLabel } from "@/lib/format";
import { nameFor } from "@/lib/names";
import { loadThread } from "@/lib/views";
import { Thread } from "./Thread";

export const metadata = { title: "Chat" };

export default async function ThreadPage(props: PageProps<"/chats/[matchId]">) {
  const { matchId } = await props.params;
  if (!z.uuid().safeParse(matchId).success) notFound();

  const { supabase, userId } = await requireProfile();
  // One call; null unless I am one of the two people in this chat.
  const thread = await loadThread(supabase, matchId);
  if (!thread) notFound();

  const plan = thread.proposed_at
    ? [slotLabel(new Date(thread.proposed_at)), thread.place]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Thread
      matchId={matchId}
      meId={userId}
      other={{
        id: thread.other_id,
        firstName: thread.first_name,
        lastInitial: thread.last_initial,
        name: nameFor(thread.first_name, thread.last_initial, thread.last_name),
      }}
      plan={plan}
      ended={thread.ended}
      initialMessages={thread.messages}
      initialHasMore={thread.has_more}
    />
  );
}
