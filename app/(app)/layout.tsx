import { TabBar } from "@/components/ios/TabBar";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireProfile();
  return (
    <>
      <main className="pb-[calc(50px+env(safe-area-inset-bottom)+16px)]">
        {children}
      </main>
      <TabBar />
    </>
  );
}
