import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState, homeFor } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

const settingsSchema = z.object({
  external: z.object({ google: z.boolean().optional() }),
});

async function isGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(
      `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
      {
        headers: { apikey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return false;
    return settingsSchema.parse(await res.json()).external.google === true;
  } catch {
    return false;
  }
}

export default async function LoginPage(props: PageProps<"/login">) {
  const state = await getAuthState();
  if (state.userId) redirect(homeFor(state));

  const { error, deleted } = await props.searchParams;
  const googleEnabled = await isGoogleEnabled();
  return (
    <LoginForm
      googleEnabled={googleEnabled}
      callbackError={error === "auth"}
      accountDeleted={deleted === "1"}
    />
  );
}
