import Link from "next/link";
import { Avatar } from "@/components/ios/Avatar";
import { LargeTitle } from "@/components/ios/LargeTitle";
import { SectionLabel } from "@/components/ios/ListGroup";
import { StateMessage } from "@/components/ios/StateMessage";
import { requireProfile } from "@/lib/auth";
import { getChatsOverview } from "@/lib/chats";
import { relativeTime, slotLabel } from "@/lib/format";
import { nameFor } from "@/lib/names";
import { RequestCard, WaitingRow } from "./RequestRows";

export const metadata = { title: "Chats" };

export default async function ChatsPage() {
  const { supabase, userId } = await requireProfile();
  const [{ incoming, outgoing, conversations }, lastNames] = await Promise.all([
    getChatsOverview(supabase, userId),
    supabase.rpc("my_match_last_names"),
  ]);
  const lastNameOf = new Map(
    (lastNames.data ?? []).map((r) => [r.other_id, r.last_name]),
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
        <section className="mt-4 mb-6">
          <SectionLabel>
            {incoming.length > 1 ? "New requests" : "New request"}
          </SectionLabel>
          <ul className="flex flex-col gap-2.5 px-5">
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
          </ul>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="mt-4 mb-4">
          <SectionLabel>Waiting</SectionLabel>
          <ul>
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
          </ul>
        </section>
      ) : null}

      {conversations.length > 0 ? (
        <section className="mt-4 mb-4">
          <SectionLabel>Messages</SectionLabel>
          <ul>
            {conversations.map((c) => {
              const unread = Number(c.unread_count) > 0 && !c.ended;
              const name = nameFor(
                c.other_first_name,
                c.other_last_initial,
                lastNameOf.get(c.other_id),
              );
              return (
                <li key={c.match_id}>
                  <Link
                    href={`/chats/${c.match_id}`}
                    aria-label={
                      unread ? `${name}, ${c.unread_count} unread` : undefined
                    }
                    className={`flex items-center gap-3 px-5 py-3 focus-visible:bg-surface focus-visible:outline-none active:bg-surface ${
                      c.ended ? "opacity-55" : ""
                    }`}
                  >
                    <Avatar
                      id={c.other_id}
                      firstName={c.other_first_name}
                      lastInitial={c.other_last_initial}
                      size={46}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-display text-[15px] leading-[17px]">
                          {name}
                        </p>
                        <span className="shrink-0 text-foot text-secondary">
                          {relativeTime(new Date(c.last_at), now)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-[13.5px] ${
                          unread
                            ? "font-bold text-label"
                            : "font-medium text-secondary"
                        }`}
                      >
                        {c.ended
                          ? "Ended"
                          : (c.last_body ?? "Say hello and confirm the plan")}
                      </p>
                    </div>
                    {unread ? (
                      <span
                        aria-hidden="true"
                        className="size-[9px] shrink-0 rounded-full bg-accent"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
