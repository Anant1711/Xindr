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
      <NavBar left={<BackButton fallbackHref="/" label="Back" />} />
      <article className="px-5 pt-1 text-[15px] leading-[23px] [&_h2]:mt-6 [&_h2]:mb-1 [&_h2]:text-[17px] [&_h2]:font-bold [&_li]:mt-1 [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-2">
        <h1 className="font-display text-[30px] leading-[32px]">{title}</h1>
        <p className="mt-4! rounded-[14px] bg-[#fff4e5] px-4 py-3 text-sub text-[#7a4b00]">
          Draft for review. This text must be reviewed by a lawyer before public
          launch (India&apos;s DPDP Act applies).
        </p>
        {children}
      </article>
    </div>
  );
}
