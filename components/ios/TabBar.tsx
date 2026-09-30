"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, PeopleIcon, PersonIcon } from "./icons";

type TabBarProps = { chatsBadge?: number };

const tabs = [
  { href: "/nearby", label: "Nearby", Icon: PeopleIcon },
  { href: "/chats", label: "Chats", Icon: ChatIcon },
  { href: "/profile", label: "Profile", Icon: PersonIcon },
] as const;

export function TabBar({ chatsBadge = 0 }: TabBarProps) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Tabs"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] bg-[#f9f9f9]/85 shadow-[inset_0_0.5px_0_rgb(0_0_0/0.2)] backdrop-blur-xl backdrop-saturate-150"
    >
      <ul className="flex h-[50px]">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === "/chats" ? chatsBadge : 0;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={badge > 0 ? `${label}, ${badge} new` : label}
                className={`flex h-full flex-col items-center justify-center gap-0.5 pt-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  active ? "text-accent" : "text-[#999999]"
                }`}
              >
                <span className="relative">
                  <Icon filled={active} size={26} />
                  {badge > 0 ? (
                    <span className="absolute -top-1 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[12px] leading-none font-semibold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-tab font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
