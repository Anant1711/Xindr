import Link from "next/link";
import { InviteButton } from "@/components/InviteButton";
import { buttonClass } from "@/components/ios/Button";
import { StateMessage } from "@/components/ios/StateMessage";
import { requireProfile } from "@/lib/auth";
import {
  buddyCardsSchema,
  type BuddyCard,
  type LevelFilter,
} from "@/lib/buddy";
import { displayName, levelLabel } from "@/lib/format";
import { signedPhotoUrls } from "@/lib/photos/server";
import { NearbyCarousel, type CarouselPerson } from "./NearbyCarousel";

/** "Same area" or the rounded km between area centres. */
function distanceText(p: BuddyCard) {
  return p.distance_km < 0.5
    ? "Same area"
    : `${Number(p.distance_km.toFixed(1))} km`;
}

export async function NearbyList({ level }: { level: LevelFilter }) {
  const { supabase, userId } = await requireProfile();

  const [me, nearby] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_active, areas(name)")
      .eq("id", userId)
      .single(),
    supabase.rpc("nearby_profiles", level === "all" ? {} : { p_level: level }),
  ]);
  if (me.error || nearby.error) throw new Error("Could not load nearby people");

  // Discovery needs both people active, so a paused profile sees no one.
  if (!me.data.is_active) {
    return (
      <StateMessage
        title="Your profile is paused"
        body="While paused, you're hidden from Nearby and Nearby is hidden from you. Your chats stay open."
        action={
          <Link href="/profile" className={buttonClass("secondary")}>
            Manage in Profile
          </Link>
        }
      />
    );
  }

  const people = buddyCardsSchema.parse(nearby.data);
  const { data: covers } = people.length
    ? await supabase.rpc("main_photos", { p_ids: people.map((p) => p.id) })
    : { data: [] };
  const urls = await signedPhotoUrls(
    supabase,
    (covers ?? []).map((c) => c.path),
  );
  const photoOf = new Map(
    (covers ?? []).map((c) => [c.user_id, urls.get(c.path) ?? null]),
  );

  if (people.length === 0) {
    return (
      <StateMessage
        title={
          level === "all"
            ? "No one nearby yet"
            : `No ${levelLabel(level).toLowerCase()}s nearby yet`
        }
        body="It grows as friends join. Invite someone you'd like to train with."
        action={<InviteButton />}
      />
    );
  }

  const cards: CarouselPerson[] = people.map((p) => ({
    id: p.id,
    name: displayName(p.first_name, p.last_initial),
    initials: (p.first_name.charAt(0) + p.last_initial.charAt(0)).toUpperCase(),
    badge: p.same_gym ? "Same gym" : distanceText(p),
    subtitle: `${levelLabel(p.level)} · ${distanceText(p)}`,
    photo: photoOf.get(p.id) ?? null,
  }));

  // Remount on a new result set so the carousel starts at the first person again.
  return (
    <NearbyCarousel
      key={cards.map((c) => c.id).join()}
      people={cards}
      area={me.data.areas.name}
    />
  );
}
