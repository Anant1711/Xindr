import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { namesFromMetadata } from "@/lib/names";
import { Onboarding } from "./Onboarding";

export const metadata = { title: "About You" };

export default async function OnboardingPage() {
  const { supabase, userId, hasProfile } = await getAuthState();
  if (!userId) redirect("/login");
  if (hasProfile) redirect("/nearby");

  const [areas, gyms, user] = await Promise.all([
    supabase.from("areas").select("id, name").order("id"),
    supabase.from("gyms").select("id, name, area_id").order("name"),
    supabase.auth.getUser(),
  ]);
  if (areas.error || gyms.error) throw new Error("Could not load areas");

  // Google sign-ins come with a name; email sign-ins start blank.
  const names = namesFromMetadata(user.data.user?.user_metadata);
  return (
    <Onboarding areas={areas.data} gyms={gyms.data} initialNames={names} />
  );
}
