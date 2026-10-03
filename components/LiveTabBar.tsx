"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TabBar } from "@/components/ios/TabBar";
import { onLive, startLive } from "@/lib/live";
import { createClient } from "@/lib/supabase/client";

/** Screens that show requests, matches or inbox previews, so they re-render on changes. */
const showsRelationships = (path: string) =>
  path === "/chats" || path.startsWith("/people/");

/**
 * Tab bar whose Chats badge stays live (events from lib/live). Changes update the badge
 * with one small query; the screen is re-rendered only when it shows what changed, since a
 * refresh re-runs every server query on the page. An open chat adds its own messages.
 */
export function LiveTabBar({
  userId,
  initialBadge,
}: {
  userId: string;
  initialBadge: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Listeners must not restart on navigation or refresh, so read these through refs.
  const routerRef = useRef(router);
  const pathRef = useRef(pathname);
  useEffect(() => {
    routerRef.current = router;
    pathRef.current = pathname;
  }, [router, pathname]);
  const [badge, setBadge] = useState(initialBadge);
  const [serverBadge, setServerBadge] = useState(initialBadge);
  // A server render brings a fresh count; adopt it.
  if (serverBadge !== initialBadge) {
    setServerBadge(initialBadge);
    setBadge(initialBadge);
  }

  useEffect(() => startLive(userId), [userId]);

  useEffect(() => {
    let badgeTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const updateBadge = () => {
      clearTimeout(badgeTimer);
      badgeTimer = setTimeout(async () => {
        const { data } = await createClient().rpc("chats_badge");
        if (active && data !== null) setBadge(data);
      }, 300);
    };
    // A refresh re-renders the layout too, which brings a fresh badge with it.
    const refreshOrUpdateBadge = (shows: (path: string) => boolean) => {
      if (!shows(pathRef.current)) return updateBadge();
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => routerRef.current.refresh(), 300);
    };

    const stop = onLive((event) => {
      switch (event.type) {
        case "request":
        case "match":
          return refreshOrUpdateBadge(showsRelationships);
        case "message": {
          const m = event.message;
          if (m.sender_id === userId) return;
          // The open thread shows it and marks it read.
          if (pathRef.current === `/chats/${m.match_id}`) return;
          return refreshOrUpdateBadge((path) => path === "/chats");
        }
        case "read":
          return updateBadge();
      }
    });

    return () => {
      active = false;
      clearTimeout(badgeTimer);
      clearTimeout(refreshTimer);
      stop();
    };
  }, [userId]);

  return <TabBar chatsBadge={badge} />;
}
