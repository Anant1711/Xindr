import { LiveTabBar } from "@/components/LiveTabBar";
import { requireProfile } from "@/lib/auth";
import { getChatsBadge } from "@/lib/chats";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, userId } = await requireProfile();
  const badge = await getChatsBadge(supabase, userId);
  return (
    <>
      <main className="pb-[calc(50px+env(safe-area-inset-bottom)+16px)]">
        {children}
      </main>
      <LiveTabBar userId={userId} initialBadge={badge} />
    </>
  );
}
