import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// The ONLY place in the app that uses the service-role key (besides scripts/seed-dev.ts).
const serviceRoleKey = z.string().min(1);

export async function POST(request: NextRequest) {
  // Same-origin only. Session cookies are SameSite=Lax as well; this is defence in depth.
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const supabase = await createClient();
  // getUser() asks the auth server, so a stale or forged token cannot pass.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    return NextResponse.json({ ok: false }, { status: 401 });
  const userId = data.user.id;

  const key = serviceRoleKey.safeParse(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key.success) return NextResponse.json({ ok: false }, { status: 500 });

  // Revoke every session (all devices) and clear this browser's cookies first.
  await supabase.auth.signOut({ scope: "global" });

  const admin = createAdminClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    key.data,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
  // Photo files are not covered by the database cascade: remove the user's folder first.
  const { data: files } = await admin.storage
    .from("profile-photos")
    .list(userId, { limit: 100 });
  if (files && files.length > 0) {
    const { error: storageError } = await admin.storage
      .from("profile-photos")
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (storageError) return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Deleting the auth user cascades to the profile, photos rows, requests, matches, messages and blocks.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return NextResponse.json({ ok: false }, { status: 500 });

  return NextResponse.json({ ok: true });
}
