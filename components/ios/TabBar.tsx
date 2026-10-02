"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatIcon, MapPinIcon, PersonIcon } from "./icons";

type TabBarProps = { chatsBadge?: number };

const tabs = [
  { href: "/nearby", label: "Nearby", Icon: MapPinIcon },
  { href: "/chats", label: "Chats", Icon: ChatIcon },
  { href: "/profile", label: "Profile", Icon: PersonIcon },
] as const;

export function TabBar({ chatsBadge = 0 }: TabBarProps) {
  const pathname = usePathname();
  // Pushed detail screens (a person, Ask to Train, a chat thread) have their own bottom action, no tab bar.
  if (pathname.startsWith("/people/") || /^\/chats\/[^/]+$/.test(pathname))
    return null;
  return (
    <nav
      aria-label="Tabs"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-separator bg-white"
    >
      <ul className="flex h-[58px]">
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
                  active
                    ? "font-bold text-accent"
                    : "font-medium text-secondary"
                }`}
              >
                <span className="relative">
                  <Icon size={23} strokeWidth={2} />
                  {badge > 0 ? (
                    <span className="absolute -top-1 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[11px] leading-none font-bold text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-tab">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
