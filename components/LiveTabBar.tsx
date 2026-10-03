"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TabBar } from "@/components/ios/TabBar";
import { createClient } from "@/lib/supabase/client";

type MessageRow = {
  match_id: string;
  sender_id: string;
  read_at: string | null;
};

/** Screens that show requests, matches or inbox previews, so they re-render on changes. */
const showsRelationships = (path: string) =>
  path === "/chats" || path.startsWith("/people/");

/**
 * Tab bar whose Chats badge stays live (Realtime respects RLS). Changes update the badge
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
  // The subscription must not restart on navigation or refresh, so read these through refs.
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

  useEffect(() => {
    const supabase = createClient();
    let badgeTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    // Debounced: marking a chat read updates many rows, one event each.
    const updateBadge = () => {
      clearTimeout(badgeTimer);
      badgeTimer = setTimeout(async () => {
        const { data } = await supabase.rpc("chats_badge");
        if (active && data !== null) setBadge(data);
      }, 300);
    };
    // A refresh re-renders the layout too, which brings a fresh badge with it.
    const refreshOrUpdateBadge = (shows: (path: string) => boolean) => {
      if (!shows(pathRef.current)) return updateBadge();
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => routerRef.current.refresh(), 300);
    };

    const onRelationshipChange = () => refreshOrUpdateBadge(showsRelationships);
    const onNewMessage = (m: MessageRow) => {
      if (m.sender_id === userId) return;
      // The open thread shows it and marks it read.
      if (pathRef.current === `/chats/${m.match_id}`) return;
      refreshOrUpdateBadge((path) => path === "/chats");
    };
    const onMessageUpdate = (m: MessageRow) => {
      // Only my reads change my badge; ignore receipts on messages I sent.
      if (m.sender_id !== userId && m.read_at) updateBadge();
    };

    const channel = supabase
      // A unique topic per subscription: reusing a name can hand back a channel that is still closing.
      .channel(`live-${userId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "train_requests",
          filter: `to_user=eq.${userId}`,
        },
        onRelationshipChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "train_requests",
          filter: `from_user=eq.${userId}`,
        },
        onRelationshipChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        onRelationshipChange,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => onNewMessage(payload.new as MessageRow),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => onMessageUpdate(payload.new as MessageRow),
      );

    // Realtime needs the user's token so RLS can filter events.
    const subscribe = () => {
      if (active) channel.subscribe();
    };
    supabase.realtime.setAuth().then(subscribe, subscribe);

    return () => {
      active = false;
      clearTimeout(badgeTimer);
      clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return <TabBar chatsBadge={badge} />;
}
