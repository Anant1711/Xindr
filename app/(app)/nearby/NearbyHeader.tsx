"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Chips } from "@/components/ios/Chips";
import { RefreshIcon, SlidersIcon } from "@/components/ios/icons";
import { SectionLabel } from "@/components/ios/ListGroup";
import { Sheet } from "@/components/ios/Sheet";
import type { LevelFilter } from "@/lib/buddy";

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "pro", label: "Pro" },
] as const;

const iconButton =
  "relative inline-flex size-11 items-center justify-center rounded-full active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function NearbyHeader({ level }: { level: LevelFilter }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const filtered = level !== "all";

  return (
    <>
      <header className="pt-safe grid grid-cols-[44px_1fr_44px] items-center px-3 pt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={filtered ? `Filter, showing ${level} only` : "Filter"}
          className={iconButton}
        >
          <SlidersIcon />
          {filtered ? (
            <span
              aria-hidden="true"
              className="absolute top-2 right-2 size-2 rounded-full bg-accent"
            />
          ) : null}
        </button>
        <div className="flex items-center justify-center gap-1">
          <h1 className="text-[16px] font-bold">Nearby</h1>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            aria-label="Refresh"
            className={`${iconButton} size-9! text-accent`}
          >
            <RefreshIcon className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <span aria-hidden="true" />
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} title="Filter">
        <section className="pb-8">
          <SectionLabel>Level</SectionLabel>
          <div className="px-5">
            <Chips
              label="Level"
              options={OPTIONS}
              value={level}
              onChange={(next) => {
                setOpen(false);
                router.replace(
                  next === "all" ? "/nearby" : `/nearby?level=${next}`,
                  {
                    scroll: false,
                  },
                );
              }}
            />
          </div>
        </section>
      </Sheet>
    </>
  );
}
