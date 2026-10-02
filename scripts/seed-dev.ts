/**
 * Dev-only seed: 12 varied demo users. Never run against production.
 * Usage: ALLOW_DEV_SEED=true pnpm db:seed
 * Demo users sign in with the email code flow; locally the codes land in Mailpit (http://127.0.0.1:54324).
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, TablesInsert } from "../lib/database.types";

// Supabase project refs of DEV projects that may be seeded. Never add the production ref.
const DEV_PROJECT_REFS: readonly string[] = [];

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ALLOW_DEV_SEED: z.string().optional(),
  })
  .parse(process.env);

function assertSafeTarget(rawUrl: string) {
  if (env.ALLOW_DEV_SEED !== "true") {
    throw new Error("Refusing to seed: set ALLOW_DEV_SEED=true.");
  }
  const { hostname } = new URL(rawUrl);
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const ref = hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : null;
  const isAllowedDev = ref !== null && DEV_PROJECT_REFS.includes(ref);
  if (!isLocal && !isAllowedDev) {
    throw new Error(
      `Refusing to seed ${hostname}: not local and not an allow-listed dev project.`,
    );
  }
}

type Demo = Omit<
  TablesInsert<"profiles">,
  "id" | "area_id" | "gym_id" | "confirmed_18_at"
> & {
  email: string;
  area: string;
  devGym?: 1 | 2;
};

const DEMO_USERS: Demo[] = [
  {
    email: "demo+priya@example.com",
    first_name: "Priya",
    last_initial: "S",

    last_name: "Sharma",
    gender: "woman",
    level: "beginner",
    area: "Pimple Saudagar",
    devGym: 1,
    time_of_day: "evening",
    training_days: [0, 2, 4],
    focus: "General fitness",
    women_only_visibility: true,
  },
  {
    email: "demo+rohan@example.com",
    first_name: "Rohan",
    last_initial: "K",

    last_name: "Kulkarni",
    gender: "man",
    level: "intermediate",
    area: "Pimple Saudagar",
    devGym: 1,
    time_of_day: "evening",
    training_days: [0, 1, 2, 4],
    focus: "Strength",
  },
  {
    email: "demo+aisha@example.com",
    first_name: "Aisha",
    last_initial: "M",

    last_name: "Mehta",
    gender: "woman",
    level: "beginner",
    area: "Wakad",
    time_of_day: "evening",
    training_days: [1, 3, 5],
    focus: "Cardio and mobility",
    show_me: "women",
  },
  {
    email: "demo+vikram@example.com",
    first_name: "Vikram",
    last_initial: "P",

    last_name: "Patil",
    gender: "man",
    level: "pro",
    area: "Pimpri",
    time_of_day: "morning",
    training_days: [0, 1, 2, 3, 4, 5],
    focus: "Powerlifting",
  },
  {
    email: "demo+neha@example.com",
    first_name: "Neha",
    last_initial: "J",

    last_name: "Joshi",
    gender: "woman",
    level: "intermediate",
    area: "Pimple Gurav",

    time_of_day: "morning",
    training_days: [0, 2, 4, 6],
    focus: "Strength",
  },
  {
    email: "demo+arjun@example.com",
    first_name: "Arjun",
    last_initial: "D",

    last_name: "Deshmukh",
    gender: "man",
    level: "beginner",
    area: "Pimple Saudagar",
    time_of_day: "evening",
    training_days: [0, 2, 4],
    focus: "Getting started",
  },
  {
    email: "demo+sam@example.com",
    first_name: "Sam",
    last_initial: "R",

    last_name: "Rodrigues",
    gender: "other",
    level: "intermediate",
    area: "Chinchwad",
    time_of_day: "evening",
    training_days: [1, 3],
    focus: "Hypertrophy",
  },
  {
    email: "demo+meera@example.com",
    first_name: "Meera",
    last_initial: "T",

    last_name: "Thakur",
    gender: "woman",
    level: "pro",
    area: "Baner",
    time_of_day: "morning",
    training_days: [0, 1, 3, 5],
    focus: "Olympic lifting",
    women_only_visibility: true,
  },
  {
    email: "demo+kabir@example.com",
    first_name: "Kabir",
    last_initial: "N",

    last_name: "Nair",
    gender: "man",
    level: "intermediate",
    area: "Aundh",
    time_of_day: "morning",
    training_days: [5, 6],
    focus: "Weekend sessions",
    show_me: "men",
  },
  {
    email: "demo+isha@example.com",
    first_name: "Isha",
    last_initial: "G",

    last_name: "Gokhale",
    gender: "woman",
    level: "beginner",
    area: "Pimple Saudagar",
    devGym: 1,
    time_of_day: "morning",
    training_days: [0, 2, 4],
    focus: null,
  },
  {
    email: "demo+dev@example.com",
    first_name: "Dev",
    last_initial: "A",

    last_name: "Apte",
    gender: "man",
    level: "beginner",
    area: "Wakad",
    devGym: 2,
    time_of_day: "evening",
    training_days: [2, 4, 6],
    focus: "Fat loss",
  },
  {
    email: "demo+alex@example.com",
    first_name: "Alex",
    last_initial: "V",

    last_name: "Varghese",
    gender: "other",
    level: "beginner",
    area: "Pimple Saudagar",
    time_of_day: "evening",
    training_days: [0, 4],
    focus: "General fitness",
    is_active: false,
  },
];

async function main() {
  assertSafeTarget(env.NEXT_PUBLIC_SUPABASE_URL);
  const db = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

  const { data: areas, error: areaErr } = await db
    .from("areas")
    .select("id, name");
  if (areaErr) throw areaErr;
  const areaId = new Map(areas.map((a) => [a.name, a.id]));
  const need = (name: string) => {
    const id = areaId.get(name);
    if (id === undefined) throw new Error(`Area not found: ${name}`);
    return id;
  };

  // Clearly fake gyms, only so "Same gym" can be exercised in dev. Real gyms go in via the dashboard.
  const devGyms = [
    { name: "Dev Gym One (demo)", area_id: need("Pimple Saudagar") },
    { name: "Dev Gym Two (demo)", area_id: need("Wakad") },
  ];
  const { data: gyms, error: gymErr } = await db
    .from("gyms")
    .upsert(devGyms, { onConflict: "name,area_id" })
    .select("id, name");
  if (gymErr) throw gymErr;
  const gymId = (n: 1 | 2) =>
    gyms.find((g) => g.name === devGyms[n - 1].name)?.id ?? null;

  const { data: existing, error: listErr } = await db.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) throw listErr;

  let created = 0;
  for (const { email, area, devGym, ...profile } of DEMO_USERS) {
    let userId = existing.users.find((u) => u.email === email)?.id;
    if (!userId) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user.id;
      created++;
    }
    const { error } = await db.from("profiles").upsert({
      ...profile,
      id: userId,
      area_id: need(area),
      gym_id: devGym ? gymId(devGym) : null,
      confirmed_18_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  console.log(
    `Seeded ${DEMO_USERS.length} demo profiles (${created} new auth users).`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
