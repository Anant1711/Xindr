import { z } from "zod";
import { GENDERS, LEVELS, TIMES_OF_DAY } from "@/lib/validation";

/** A row from nearby_profiles() / get_buddy_profile(). Composite fields come back nullable in the generated types. */
export const buddyCardSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_initial: z.string(),
  gender: z.enum(GENDERS),
  level: z.enum(LEVELS),
  area_name: z.string(),
  gym_name: z.string().nullable(),
  same_gym: z.boolean(),
  distance_km: z.coerce.number(),
  time_of_day: z.enum(TIMES_OF_DAY),
  shared_days: z.array(z.number().int()),
  training_days: z.array(z.number().int()),
  focus: z.string().nullable(),
});

export type BuddyCard = z.infer<typeof buddyCardSchema>;

export const buddyCardsSchema = z.array(buddyCardSchema);

export const LEVEL_FILTERS = ["all", ...LEVELS] as const;
export type LevelFilter = (typeof LEVEL_FILTERS)[number];

export function parseLevelFilter(raw: unknown): LevelFilter {
  const r = z.enum(LEVEL_FILTERS).safeParse(raw);
  return r.success ? r.data : "all";
}
