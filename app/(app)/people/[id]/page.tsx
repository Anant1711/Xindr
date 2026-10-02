import { notFound } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/ios/Avatar";
import { DayPills } from "@/components/ios/DayPills";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { requireProfile } from "@/lib/auth";
import { buddyCardsSchema } from "@/lib/buddy";
import {
  displayName,
  distanceLabel,
  genderLabel,
  levelLabel,
  slotLabel,
  timeOfDayLabel,
} from "@/lib/format";
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
  const name = displayName(person.first_name, person.last_initial);
  const distance = distanceLabel(person);
  const shared = person.shared_days.length;
  const when = person.time_of_day === "morning" ? "mornings" : "evenings";

  return (
    <div>
      <BuddyNav personId={person.id} name={name} />

      <div className="flex flex-col items-center px-4 pt-4 pb-7 text-center">
        <Avatar
          id={person.id}
          firstName={person.first_name}
          lastInitial={person.last_initial}
          size={96}
        />
        <h1 className="mt-3 text-[22px] leading-7 font-bold">{name}</h1>
        <p className="mt-0.5 text-sub text-secondary">
          {levelLabel(person.level)} · {genderLabel(person.gender)} ·{" "}
          {distance.endsWith("km") ? `${distance} away` : distance}
        </p>
      </div>

      <ListGroup>
        <ListRow
          title="Usually trains"
          detail={timeOfDayLabel(person.time_of_day)}
        />
        <ListRow title="Focus" detail={person.focus ?? "Not set"} />
        {person.gym_name ? (
          <ListRow title="Gym" detail={person.gym_name} />
        ) : null}
      </ListGroup>

      <ListGroup
        header="Your overlap"
        footer={
          shared > 0
            ? `${shared} shared ${when} a week`
            : "No overlap in your usual days yet"
        }
      >
        <div className="px-4 py-3.5">
          <DayPills label="Shared training days" days={person.shared_days} />
        </div>
      </ListGroup>

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
