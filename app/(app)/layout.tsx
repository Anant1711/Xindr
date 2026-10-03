import { InstallHint } from "@/components/InstallHint";
import { LiveTabBar } from "@/components/LiveTabBar";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { userId, badge } = await requireProfile();
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
