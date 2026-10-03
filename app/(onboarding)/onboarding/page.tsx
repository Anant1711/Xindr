import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { namesFromMetadata } from "@/lib/names";
import { getPlaces } from "@/lib/places";
import { Onboarding } from "./Onboarding";

export const metadata = { title: "About You" };

export default async function OnboardingPage() {
  const { supabase, userId, hasProfile } = await getAuthState();
  if (!userId) redirect("/login");
  if (hasProfile) redirect("/nearby");

  const [{ areas, gyms }, user] = await Promise.all([
    getPlaces(supabase),
    supabase.auth.getUser(),
  ]);

  // Google sign-ins come with a name; email sign-ins start blank.
  const names = namesFromMetadata(user.data.user?.user_metadata);
  return <Onboarding areas={areas} gyms={gyms} initialNames={names} />;
}
