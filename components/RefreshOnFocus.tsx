"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Re-fetches server data when the app comes back to the foreground (at most every 30s). */
export function RefreshOnFocus() {
  const router = useRouter();
  const last = useRef(0);

  useEffect(() => {
    last.current = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - last.current < 30_000) return;
      last.current = Date.now();
      router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  return null;
}
