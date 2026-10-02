import { InviteButton } from "@/components/InviteButton";
import { Avatar } from "@/components/ios/Avatar";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { StateMessage } from "@/components/ios/StateMessage";
import { requireProfile } from "@/lib/auth";
import { buddyCardsSchema, type LevelFilter } from "@/lib/buddy";
import { displayName, distanceLabel, levelLabel } from "@/lib/format";

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
    <ListGroup
      header={`Near ${me.data.areas.name}`}
      footer="Distances are approximate, between area centres."
    >
      {people.map((p) => (
        <ListRow
          key={p.id}
          tall
          chevron
          href={`/people/${p.id}`}
          leading={
            <Avatar
              id={p.id}
              firstName={p.first_name}
              lastInitial={p.last_initial}
            />
          }
          title={displayName(p.first_name, p.last_initial)}
          subtitle={`${levelLabel(p.level)} · ${distanceLabel(p)}`}
        />
      ))}
    </ListGroup>
  );
}
