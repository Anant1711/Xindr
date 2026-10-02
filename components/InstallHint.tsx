"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { hasTabBar } from "@/components/ios/TabBar";
import { shouldShowIosInstallHint } from "@/lib/platform";

const STORAGE_KEY = "gb.installHintDismissed";

function isIosSafariBrowser() {
  return shouldShowIosInstallHint({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  });
}

function dismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

/** iOS Safari only: how to add the app to the Home Screen. Dismissal is remembered. */
export function InstallHint() {
  const pathname = usePathname();
  // The server cannot know the browser: render nothing there, decide on the client.
  const eligible = useSyncExternalStore(
    noopSubscribe,
    () => isIosSafariBrowser() && !dismissed(),
    () => false,
  );
  const [closed, setClosed] = useState(false);

  if (!eligible || closed || !hasTabBar(pathname)) return null;

  function dismiss() {
    setClosed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode: the hint simply comes back next time.
    }
  }

  return (
    <aside
      aria-label="Install the app"
      className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom)+10px)] z-30 mx-auto max-w-[430px] px-3"
    >
      <div className="flex items-center gap-3 rounded-group bg-label px-4 py-3 text-white shadow-lg">
        <p className="flex-1 text-sub leading-5">
          Install Gym Buddy: tap{" "}
          <svg
            aria-label="Share"
            role="img"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="inline -translate-y-px"
          >
            <path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 11v9h14v-9" />
          </svg>{" "}
          then <span className="font-bold">Add to Home Screen</span>.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 after:absolute after:-inset-1.5 after:content-['']"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
