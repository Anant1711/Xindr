import Link from "next/link";
import { InviteButton } from "@/components/InviteButton";
import { Avatar } from "@/components/ios/Avatar";
import { SectionLabel } from "@/components/ios/ListGroup";
import { StateMessage } from "@/components/ios/StateMessage";
import { requireProfile } from "@/lib/auth";
import {
  buddyCardsSchema,
  type BuddyCard,
  type LevelFilter,
} from "@/lib/buddy";
import { displayName, levelLabel } from "@/lib/format";

/** Card subtitle: the gym badge carries "Same gym", so here it is area or km. */
function distanceText(p: BuddyCard) {
  return p.distance_km < 0.5
    ? "Same area"
    : `${Number(p.distance_km.toFixed(1))} km`;
}

export async function NearbyList({ level }: { level: LevelFilter }) {
  const { supabase, userId } = await requireProfile();

  const [me, nearby] = await Promise.all([
    supabase.from("profiles").select("areas(name)").eq("id", userId).single(),
    supabase.rpc("nearby_profiles", level === "all" ? {} : { p_level: level }),
  ]);
  if (me.error || nearby.error) throw new Error("Could not load nearby people");

  const people = buddyCardsSchema.parse(nearby.data);

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

  return (
    <section className="mb-6">
      <SectionLabel>Near {me.data.areas.name}</SectionLabel>
      <ul className="flex flex-col gap-2.5 px-5">
        {people.map((p) => {
          const name = displayName(p.first_name, p.last_initial);
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-group border border-separator bg-card p-3.5"
            >
              <Link
                href={`/people/${p.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <Avatar
                  id={p.id}
                  firstName={p.first_name}
                  lastInitial={p.last_initial}
                  size={52}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-[16px] leading-[18px]">
                      {name}
                    </span>
                    {p.same_gym ? (
                      <span className="shrink-0 rounded-lg bg-accent-tint px-2 py-0.5 text-[11px] font-bold text-accent">
                        Same gym
                      </span>
                    ) : null}
                  </div>
                  <span className="truncate text-[13px] font-medium text-secondary">
                    {levelLabel(p.level)} · {distanceText(p)}
                  </span>
                </div>
              </Link>
              <Link
                href={`/people/${p.id}/ask`}
                aria-label={`Ask ${name} to train`}
                className="relative inline-flex h-[38px] shrink-0 items-center rounded-full bg-accent px-[18px] text-[13.5px] font-bold text-white after:absolute after:-inset-[3px] after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-85"
              >
                Ask
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mx-5 mt-3 text-sub text-secondary">
        Distances are approximate, between area centres.
      </p>
    </section>
  );
}
