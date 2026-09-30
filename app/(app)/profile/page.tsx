import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ios/Avatar";
import { LargeTitle } from "@/components/ios/LargeTitle";
import { ListGroup } from "@/components/ios/ListGroup";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "Profile" };

// Phase 6 fills in details, preferences, pause, blocked people and account deletion.
export default async function ProfilePage() {
  const { supabase, userId } = await requireProfile();
  const { data: me } = await supabase
    .from("profiles")
    .select("first_name, last_initial, areas(name)")
    .eq("id", userId)
    .single();

  return (
    <div className="pt-safe">
      <LargeTitle>Profile</LargeTitle>
      {me ? (
        <ListGroup>
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar
              id={userId}
              firstName={me.first_name}
              lastInitial={me.last_initial}
              size={56}
            />
            <div>
              <p className="text-body font-semibold">
                {me.first_name} {me.last_initial}.
              </p>
              <p className="text-sub text-secondary">{me.areas.name}</p>
            </div>
          </div>
        </ListGroup>
      ) : null}
      <ListGroup>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-[44px] w-full items-center px-4 text-left text-body text-accent active:bg-[#e5e5ea]"
          >
            Sign out
          </button>
        </form>
      </ListGroup>
    </div>
  );
}
