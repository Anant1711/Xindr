"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Chips } from "@/components/ios/Chips";
import type { LevelFilter } from "@/lib/buddy";

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "pro", label: "Pro" },
] as const;

export function LevelFilterControl({ value }: { value: LevelFilter }) {
  const router = useRouter();
  const [selected, setSelected] = useState(value);
  const [, startTransition] = useTransition();

  return (
    <Chips
      scroll
      label="Level"
      options={OPTIONS}
      value={selected}
      onChange={(next) => {
        setSelected(next);
        startTransition(() => {
          router.replace(next === "all" ? "/nearby" : `/nearby?level=${next}`, {
            scroll: false,
          });
        });
      }}
    />
  );
}
