import { InstallHint } from "@/components/InstallHint";
import { LiveTabBar } from "@/components/LiveTabBar";
import { requireProfile } from "@/lib/auth";
import { getChatsBadge } from "@/lib/chats";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, userId } = await requireProfile();
  const badge = await getChatsBadge(supabase);
  return (
    <>
      <main className="pb-[calc(58px+env(safe-area-inset-bottom)+24px)]">
        {children}
      </main>
      <InstallHint />
      <LiveTabBar userId={userId} initialBadge={badge} />
    </>
  );
}
