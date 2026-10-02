import { requireProfile } from "@/lib/auth";
import { PreferencesForm } from "./PreferencesForm";

export const metadata = { title: "Preferences" };

export default async function PreferencesPage() {
  const { supabase, userId } = await requireProfile();
  const { data, error } = await supabase
    .from("profiles")
    .select("gender, show_me, women_only_visibility")
    .eq("id", userId)
    .single();
  if (error) throw new Error("Could not load preferences");

  return (
    <PreferencesForm
      gender={data.gender}
      initial={{
        showMe: data.show_me,
        womenOnlyVisibility: data.women_only_visibility,
      }}
    />
  );
}
