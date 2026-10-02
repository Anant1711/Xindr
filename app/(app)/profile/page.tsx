import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ios/Avatar";
import { LargeTitle } from "@/components/ios/LargeTitle";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { requireProfile } from "@/lib/auth";
import { displayName, levelLabel } from "@/lib/format";
import {
  DeleteAccountRow,
  FeedbackRow,
  InviteRow,
  PauseToggle,
} from "./ProfileControls";

export const metadata = { title: "Profile" };

const SHOW_ME_LABEL = { women: "Women", men: "Men", anyone: "Anyone" } as const;

export default async function ProfilePage() {
  const { supabase, userId } = await requireProfile();
  const [{ data: me }, blocked] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, last_initial, level, show_me, is_active, areas(name)",
      )
      .eq("id", userId)
      .single(),
    supabase.rpc("my_blocked_people"),
  ]);
  if (!me) throw new Error("Could not load profile");
  const blockedCount = blocked.data?.length ?? 0;

  return (
    <div className="pt-safe">
      <LargeTitle>Profile</LargeTitle>

      <div className="mx-5 mt-4 mb-6 flex items-center gap-3.5 rounded-group border border-separator p-4">
        <Avatar
          id={userId}
          firstName={me.first_name}
          lastInitial={me.last_initial}
          size={60}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[20px] leading-[22px]">
            {displayName(me.first_name, me.last_initial)}
          </p>
          <p className="mt-1 truncate text-sub text-secondary">
            {levelLabel(me.level)} · {me.areas.name}
          </p>
        </div>
        <Link
          href="/profile/details"
          className="inline-flex min-h-[44px] items-center rounded-full bg-accent-tint px-4 text-[14px] font-bold text-accent"
        >
          Edit
        </Link>
      </div>

      <ListGroup header="Your profile">
        <ListRow title="My details" chevron href="/profile/details" />
        <ListRow
          title="Preferences"
          detail={`Show me: ${SHOW_ME_LABEL[me.show_me]}`}
          chevron
          href="/profile/preferences"
        />
      </ListGroup>

      <ListGroup footer="Hide me from Nearby while you take a break. You won't see others there either; your chats stay open.">
        <ListRow
          title="Pause my profile"
          trailing={<PauseToggle paused={!me.is_active} />}
        />
      </ListGroup>

      <ListGroup header="Community">
        <InviteRow />
        <ListRow
          title="Blocked people"
          detail={blockedCount > 0 ? String(blockedCount) : "None"}
          chevron
          href="/profile/blocked"
        />
        <FeedbackRow />
      </ListGroup>

      <ListGroup header="Help and legal">
        <ListRow title="Safety tips" chevron href="/safety" />
        <ListRow title="Terms" chevron href="/terms" />
        <ListRow title="Privacy" chevron href="/privacy" />
      </ListGroup>

      <ListGroup>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center px-4 text-left text-body font-semibold text-accent active:bg-surface"
          >
            Sign out
          </button>
        </form>
      </ListGroup>

      <ListGroup footer="Permanently deletes your profile, requests, chats and blocks.">
        <DeleteAccountRow />
      </ListGroup>
    </div>
  );
}
