import { Avatar } from "@/components/ios/Avatar";
import { LargeTitle } from "@/components/ios/LargeTitle";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { StateMessage } from "@/components/ios/StateMessage";
import { requireProfile } from "@/lib/auth";
import { getChatsOverview } from "@/lib/chats";
import { displayName, relativeTime, slotLabel } from "@/lib/format";
import { RequestCard, WaitingRow } from "./RequestRows";

export const metadata = { title: "Chats" };

export default async function ChatsPage() {
  const { supabase, userId } = await requireProfile();
  const { incoming, outgoing, conversations } = await getChatsOverview(
    supabase,
    userId,
  );
  const now = new Date();

  const empty =
    incoming.length === 0 &&
    outgoing.length === 0 &&
    conversations.length === 0;

  return (
    <div className="pt-safe">
      <LargeTitle>Chats</LargeTitle>

      {empty ? (
        <StateMessage
          title="No messages yet"
          body="When someone accepts your request, your chat appears here."
        />
      ) : null}

      {incoming.length > 0 ? (
        <ListGroup
          header={incoming.length > 1 ? "New requests" : "New request"}
        >
          {incoming.map((r) => (
            <RequestCard
              key={r.id}
              requestId={r.id}
              personId={r.person.id}
              firstName={r.person.first_name}
              lastInitial={r.person.last_initial}
              slot={slotLabel(new Date(r.proposed_at), now)}
              note={r.note}
            />
          ))}
        </ListGroup>
      ) : null}

      {outgoing.length > 0 ? (
        <ListGroup header="Waiting">
          {outgoing.map((r) => (
            <WaitingRow
              key={r.id}
              requestId={r.id}
              personId={r.person.id}
              firstName={r.person.first_name}
              lastInitial={r.person.last_initial}
              slot={slotLabel(new Date(r.proposed_at), now)}
            />
          ))}
        </ListGroup>
      ) : null}

      {conversations.length > 0 ? (
        <ListGroup header="Messages">
          {conversations.map((c) => {
            const unread = Number(c.unread_count) > 0;
            return (
              <ListRow
                key={c.match_id}
                tall
                chevron
                href={`/chats/${c.match_id}`}
                bold={unread && !c.ended}
                dimmed={c.ended}
                leading={
                  <Avatar
                    id={c.other_id}
                    firstName={c.other_first_name}
                    lastInitial={c.other_last_initial}
                  />
                }
                title={displayName(c.other_first_name, c.other_last_initial)}
                subtitle={
                  c.ended
                    ? "Ended"
                    : (c.last_body ?? "Say hello and confirm the plan")
                }
                detail={relativeTime(new Date(c.last_at), now)}
                ariaLabel={
                  unread && !c.ended
                    ? `${displayName(c.other_first_name, c.other_last_initial)}, ${c.unread_count} unread`
                    : undefined
                }
              />
            );
          })}
        </ListGroup>
      ) : null}
    </div>
  );
}
