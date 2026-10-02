import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { buddyCardsSchema } from "@/lib/buddy";
import { displayName, slotLabel } from "@/lib/format";
import { getRelationship } from "@/lib/relationship";
import { suggestSlots } from "@/lib/slots";
import { AskForm } from "./AskForm";

export const metadata = { title: "Ask to Train" };

export default async function AskPage(props: PageProps<"/people/[id]/ask">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, userId } = await requireProfile();
  if (id === userId) notFound();

  const { data, error } = await supabase.rpc("get_buddy_profile", { p_id: id });
  if (error) throw new Error("Could not load profile");
  const person = buddyCardsSchema.parse(data)[0];
  if (!person) notFound();

  // Only "no relationship" can send; otherwise the profile shows the right action.
  const relationship = await getRelationship(supabase, userId, id);
  if (relationship.kind !== "none") redirect(`/people/${id}`);

  const now = new Date();
  const { slots, overlap } = suggestSlots({
    now,
    sharedDays: person.shared_days,
    targetDays: person.training_days,
    timeOfDay: person.time_of_day,
  });

  return (
    <AskForm
      personId={person.id}
      name={displayName(person.first_name, person.last_initial)}
      overlap={overlap}
      slots={slots.map((d) => ({
        iso: d.toISOString(),
        label: slotLabel(d, now),
      }))}
    />
  );
}
