import { Avatar } from "@/components/ios/Avatar";
import { BackButton, NavBar } from "@/components/ios/NavBar";
import { StateMessage } from "@/components/ios/StateMessage";
import { requireProfile } from "@/lib/auth";
import { displayName } from "@/lib/format";
import { UnblockButton } from "./UnblockButton";

export const metadata = { title: "Blocked people" };

export default async function BlockedPage() {
  const { supabase } = await requireProfile();
  const { data, error } = await supabase.rpc("my_blocked_people");
  if (error) throw new Error("Could not load blocked people");

  return (
    <main className="min-h-dvh">
      <NavBar
        left={<BackButton href="/profile" label="Back to Profile" />}
        title="Blocked people"
      />
      {data.length === 0 ? (
        <StateMessage
          title="No one blocked"
          body="If someone makes you uncomfortable, open their profile or chat and tap the three dots."
        />
      ) : (
        <>
          <p className="mx-5 mt-2 mb-4 text-sub text-secondary">
            They can&apos;t find or message you. Unblocking lets you see each
            other in Nearby again; past chats stay ended.
          </p>
          <ul>
            {data.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar
                  id={p.id}
                  firstName={p.first_name}
                  lastInitial={p.last_initial}
                  size={46}
                />
                <span className="min-w-0 flex-1 truncate font-display text-[15px] leading-[17px]">
                  {displayName(p.first_name, p.last_initial)}
                </span>
                <UnblockButton
                  personId={p.id}
                  name={displayName(p.first_name, p.last_initial)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
