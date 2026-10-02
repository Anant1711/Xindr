import { notFound } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/ios/Avatar";
import { DayPills } from "@/components/ios/DayPills";
import { SectionLabel } from "@/components/ios/ListGroup";
import { requireProfile } from "@/lib/auth";
import { buddyCardsSchema } from "@/lib/buddy";
import {
  distanceLabel,
  genderLabel,
  levelLabel,
  slotLabel,
  timeOfDayLabel,
} from "@/lib/format";
import { nameFor } from "@/lib/names";
import { getRelationship } from "@/lib/relationship";
import { BuddyActions } from "./BuddyActions";
import { BuddyNav } from "./BuddyNav";

export const metadata = { title: "Profile" };

export default async function BuddyPage(props: PageProps<"/people/[id]">) {
  const { id } = await props.params;
  // Malformed ids get the same 404 as hidden or missing people.
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, userId } = await requireProfile();
  if (id === userId) notFound();

  const { data, error } = await supabase.rpc("get_buddy_profile", { p_id: id });
  if (error) throw new Error("Could not load profile");
  const person = buddyCardsSchema.parse(data)[0];
  if (!person) notFound();

  const relationship = await getRelationship(supabase, userId, id);
  // Full last name only once matched (the function returns null otherwise).
  const lastName =
    relationship.kind === "matched"
      ? (await supabase.rpc("visible_last_name", { p_id: id })).data
      : null;
  const name = nameFor(person.first_name, person.last_initial, lastName);
  const distance = distanceLabel(person);
  const shared = person.shared_days.length;
  const when = person.time_of_day === "morning" ? "mornings" : "evenings";

  const chip = "rounded-[10px] px-[11px] py-1 text-[12px] font-bold";

  return (
    <div>
      <BuddyNav personId={person.id} name={name} />

      <div className="flex flex-col items-center gap-3.5 px-5 pt-2.5 pb-6 text-center">
        <Avatar
          id={person.id}
          firstName={person.first_name}
          lastInitial={person.last_initial}
          size={88}
        />
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-[26px] leading-[28px]">{name}</h1>
          <ul
            className="flex flex-wrap justify-center gap-2"
            aria-label="About"
          >
            <li className={`${chip} bg-accent-tint text-accent`}>
              {levelLabel(person.level)}
            </li>
            <li className={`${chip} bg-surface text-label`}>
              {genderLabel(person.gender)}
            </li>
            <li className={`${chip} bg-surface text-label`}>
              {distance.endsWith("km") ? `${distance} away` : distance}
            </li>
          </ul>
        </div>
      </div>

      <dl className="mx-5 mb-6 rounded-group border border-separator px-4">
        <DetailRow
          label="Usually trains"
          value={timeOfDayLabel(person.time_of_day)}
        />
        <DetailRow label="Focus" value={person.focus ?? "Not set"} />
        {person.gym_name ? (
          <DetailRow label="Gym" value={person.gym_name} />
        ) : null}
      </dl>

      <section className="mb-6">
        <SectionLabel>Your overlap</SectionLabel>
        <div className="mx-5 flex flex-col gap-2.5 rounded-group bg-success-tint p-4">
          <DayPills label="Shared training days" days={person.shared_days} />
          <p className="text-center text-[13px] font-semibold text-success-ink">
            {shared > 0
              ? `${shared} shared ${when} a week`
              : "No overlap in your usual days yet"}
          </p>
        </div>
      </section>

      <BuddyActions
        personId={person.id}
        firstName={person.first_name}
        relationship={relationship}
        slot={
          relationship.kind === "sent" || relationship.kind === "received"
            ? slotLabel(new Date(relationship.proposedAt))
            : null
        }
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-separator py-3.5 last:border-b-0">
      <dt className="text-[13px] font-semibold text-secondary">{label}</dt>
      <dd className="truncate text-[15px] font-semibold">{value}</dd>
    </div>
  );
}
