import { requireProfile } from "@/lib/auth";
import { getPlaces } from "@/lib/places";
import { DetailsForm } from "./DetailsForm";

export const metadata = { title: "My details" };

export default async function DetailsPage() {
  const { supabase, userId } = await requireProfile();
  const [me, { areas, gyms }, lastName] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, gender, level, area_id, gym_id, time_of_day, training_days, focus",
      )
      .eq("id", userId)
      .single(),
    getPlaces(supabase),
    // last_name is not directly selectable; your own comes through this function.
    supabase.rpc("visible_last_name", { p_id: userId }),
  ]);
  if (me.error) throw new Error("Could not load details");

  const p = me.data;
  return (
    <DetailsForm
      areas={areas}
      gyms={gyms}
      initial={{
        firstName: p.first_name,
        lastName: lastName.data ?? "",
        gender: p.gender,
        level: p.level,
        areaId: p.area_id,
        gymId: p.gym_id,
        timeOfDay: p.time_of_day,
        trainingDays: p.training_days,
        focus: p.focus ?? "",
      }}
    />
  );
}
