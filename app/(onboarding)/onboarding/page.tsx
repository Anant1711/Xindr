import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { Onboarding } from "./Onboarding";

export const metadata = { title: "About You" };

export default async function OnboardingPage() {
  const { supabase, userId, hasProfile } = await getAuthState();
  if (!userId) redirect("/login");
  if (hasProfile) redirect("/nearby");

  const [areas, gyms] = await Promise.all([
    supabase.from("areas").select("id, name").order("id"),
    supabase.from("gyms").select("id, name, area_id").order("name"),
  ]);
  if (areas.error || gyms.error) throw new Error("Could not load areas");

  return <Onboarding areas={areas.data} gyms={gyms.data} />;
}
