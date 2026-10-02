"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TabBar } from "@/components/ios/TabBar";
import { getChatsBadge } from "@/lib/chats";
import { createClient } from "@/lib/supabase/client";

/**
 * Tab bar whose Chats badge stays live. Any change to the viewer's requests, matches or
 * messages (Realtime respects RLS) refreshes the badge and the current screen.
 */
export function LiveTabBar({
  userId,
  initialBadge,
}: {
  userId: string;
  initialBadge: number;
}) {
  const router = useRouter();
  // Refreshing must not re-run the subscription effect, so read the router through a ref.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const [badge, setBadge] = useState(initialBadge);
  const [serverBadge, setServerBadge] = useState(initialBadge);
  // A server refresh brings a fresh count; adopt it.
  if (serverBadge !== initialBadge) {
    setServerBadge(initialBadge);
    setBadge(initialBadge);
  }

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const next = await getChatsBadge(supabase, userId);
        if (!active) return;
        setBadge(next);
        routerRef.current.refresh();
      }, 250);
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
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "train_requests",
          filter: `from_user=eq.${userId}`,
        },
        onChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        onChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        onChange,
      );

    // Realtime needs the user's token so RLS can filter events.
    const subscribe = () => {
      if (active) channel.subscribe();
    };
    supabase.realtime.setAuth().then(subscribe, subscribe);

    return () => {
      active = false;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return <TabBar chatsBadge={badge} />;
}
