import { LIMITS } from "@/lib/constants";

/** Google (via Supabase) puts names in user_metadata under these keys; all optional. */
type NameMetadata = {
  given_name?: unknown;
  family_name?: unknown;
  full_name?: unknown;
  name?: unknown;
};

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";

/** Best-effort first and last name from the sign-in provider, for pre-filling onboarding. */
export function namesFromMetadata(meta: NameMetadata | null | undefined): {
  firstName: string;
  lastName: string;
} {
  if (!meta) return { firstName: "", lastName: "" };
  const given = clean(meta.given_name, LIMITS.firstName);
  const family = clean(meta.family_name, LIMITS.lastName);
  if (given || family) return { firstName: given, lastName: family };

  const full = clean(meta.full_name || meta.name, 200);
  if (!full) return { firstName: "", lastName: "" };
  const [first, ...rest] = full.split(" ");
  return {
    firstName: first.slice(0, LIMITS.firstName),
    lastName: rest.join(" ").slice(0, LIMITS.lastName),
  };
}

/** "Chauhan" -> "C"; works for non-Latin letters too. */
export function initialOf(lastName: string): string {
  return lastName.trim().charAt(0).toLocaleUpperCase();
}

/** Full name for yourself and matched people; "First L." everywhere else. */
export function nameFor(
  firstName: string,
  lastInitial: string,
  lastName?: string | null,
) {
  return lastName
    ? `${firstName} ${lastName}`
    : `${firstName} ${lastInitial.toUpperCase()}.`;
}
