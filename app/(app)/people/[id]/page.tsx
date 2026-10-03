import { notFound } from "next/navigation";
import { z } from "zod";
import { Avatar } from "@/components/ios/Avatar";
import { DayPills } from "@/components/ios/DayPills";
import { SectionLabel } from "@/components/ios/ListGroup";
import { requireProfile } from "@/lib/auth";
import {
  distanceLabel,
  genderLabel,
  levelLabel,
  slotLabel,
  timeOfDayLabel,
} from "@/lib/format";
import { nameFor } from "@/lib/names";
import { signedPhotoUrls } from "@/lib/photos/server";
import { relationshipOf } from "@/lib/relationship";
import { loadPerson } from "@/lib/views";
import { BuddyActions } from "./BuddyActions";
import { BuddyNav } from "./BuddyNav";
import { PhotoGallery } from "./PhotoGallery";

export const metadata = { title: "Profile" };

export default async function BuddyPage(props: PageProps<"/people/[id]">) {
  const { id } = await props.params;
  // Malformed ids get the same 404 as hidden or missing people.
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase, userId } = await requireProfile();
  if (id === userId) notFound();

  const view = await loadPerson(supabase, id);
  if (!view) notFound();
  const person = view.card;
  const relationship = relationshipOf(view);
  // Full last name only once matched.
  const lastName = relationship.kind === "matched" ? view.last_name : null;
  const name = nameFor(person.first_name, person.last_initial, lastName);
  const photoUrls = await signedPhotoUrls(
    supabase,
    userId,
    view.photos.map((r) => r.path),
  );
  const photos = view.photos.flatMap((r) => {
    const url = photoUrls.get(r.path);
    return url ? [{ url, width: r.width, height: r.height }] : [];
  });
  const distance = distanceLabel(person);
  const shared = person.shared_days.length;
  const when = person.time_of_day === "morning" ? "mornings" : "evenings";

  const chip = "rounded-[10px] px-[11px] py-1 text-[12px] font-bold";

  return (
    <div>
      <BuddyNav personId={person.id} name={name} />

      <div className="flex flex-col items-center gap-3.5 px-5 pt-2.5 pb-6 text-center">
        {photos.length > 0 ? (
          <PhotoGallery photos={photos} name={name} />
        ) : (
          <Avatar
            id={person.id}
            firstName={person.first_name}
            lastInitial={person.last_initial}
            size={88}
          />
        )}
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

      {(relationship.kind === "received" || relationship.kind === "sent") &&
      relationship.note ? (
        <section className="mb-6">
          <SectionLabel>
            {relationship.kind === "received"
              ? `${person.first_name}'s message`
              : "Your message"}
          </SectionLabel>
          {/* Plain text only; never rendered as HTML. */}
          <p className="mx-5 rounded-group bg-accent-tint px-4 py-3 text-[15px] break-words whitespace-pre-wrap">
            {relationship.note}
          </p>
        </section>
      ) : null}

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
