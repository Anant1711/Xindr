import { z } from "zod";

// NEXT_PUBLIC_ values are inlined at build time, so they must be referenced literally.
// On Vercel, NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL is provided automatically (a bare host).
const vercelHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const publicEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.url(),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (vercelHost ? `https://${vercelHost}` : "http://localhost:3000"),
  });
