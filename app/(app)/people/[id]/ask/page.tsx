import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { displayName, slotLabel } from "@/lib/format";
import { relationshipOf } from "@/lib/relationship";
import { suggestSlots } from "@/lib/slots";
import { loadPerson } from "@/lib/views";
import { AskForm } from "./AskForm";

export const metadata = { title: "Ask to Train" };

export default async function AskPage(props: PageProps<"/people/[id]/ask">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, userId } = await requireProfile();
  if (id === userId) notFound();

  const view = await loadPerson(supabase, id);
  if (!view) notFound();
  const person = view.card;

  // Only "no relationship" can send; otherwise the profile shows the right action.
  if (relationshipOf(view).kind !== "none") redirect(`/people/${id}`);

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
