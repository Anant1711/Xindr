import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Areas and gyms are the same for every signed-in user and change rarely (admins add
// them), so the lists are kept per server instance for a few minutes.
const TTL_MS = 5 * 60 * 1000;

type Tables = Database["public"]["Tables"];
type Places = {
  areas: Pick<Tables["areas"]["Row"], "id" | "name">[];
  gyms: Pick<Tables["gyms"]["Row"], "id" | "name" | "area_id">[];
};

let cached: { value: Places; at: number } | null = null;

export async function getPlaces(
  supabase: SupabaseClient<Database>,
): Promise<Places> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const [areas, gyms] = await Promise.all([
    supabase.from("areas").select("id, name").order("id"),
    supabase.from("gyms").select("id, name, area_id").order("name"),
  ]);
  if (areas.error || gyms.error) throw new Error("Could not load areas");
  const value = { areas: areas.data, gyms: gyms.data };
  cached = { value, at: Date.now() };
  return value;
}
