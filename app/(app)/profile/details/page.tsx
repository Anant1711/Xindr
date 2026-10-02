import { requireProfile } from "@/lib/auth";
import { DetailsForm } from "./DetailsForm";

export const metadata = { title: "My details" };

export default async function DetailsPage() {
  const { supabase, userId } = await requireProfile();
  const [me, areas, gyms] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, last_initial, gender, level, area_id, gym_id, time_of_day, training_days, focus",
      )
      .eq("id", userId)
      .single(),
    supabase.from("areas").select("id, name").order("id"),
    supabase.from("gyms").select("id, name, area_id").order("name"),
  ]);
  if (me.error || areas.error || gyms.error)
    throw new Error("Could not load details");

  const p = me.data;
  return (
    <DetailsForm
      areas={areas.data}
      gyms={gyms.data}
      initial={{
        firstName: p.first_name,
        lastInitial: p.last_initial,
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
