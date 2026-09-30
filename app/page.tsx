import { redirect } from "next/navigation";
import { getAuthState, homeFor } from "@/lib/auth";

export default async function Home() {
  redirect(homeFor(await getAuthState()));
}
