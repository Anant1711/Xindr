import type { ReactNode } from "react";
import { BackButton, NavBar } from "@/components/ios/NavBar";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-safe min-h-dvh pb-12">
      <NavBar title={title} left={<BackButton href="/" label="Back" />} />
      <article className="mx-4 mt-4 rounded-group bg-card p-4 text-sub [&_h2]:mt-5 [&_h2]:mb-1 [&_h2]:text-body [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-2">
        <p className="rounded-lg bg-[#fff4e5] p-3 text-foot">
          Draft for review. This text must be reviewed by a lawyer before public
          launch (India&apos;s DPDP Act applies).
        </p>
        {children}
      </article>
    </div>
  );
}
