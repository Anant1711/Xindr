"use client";

import { Chips } from "@/components/ios/Chips";
import { SectionLabel } from "@/components/ios/ListGroup";
import { Toggle } from "@/components/ios/Toggle";
import { SHOW_ME_OPTIONS, type Gender, type PreferencesDraft } from "./types";

type Props = {
  value: PreferencesDraft;
  onChange: (next: PreferencesDraft) => void;
  gender: Gender | null;
};

export function PreferencesFields({ value, onChange, gender }: Props) {
  return (
    <>
      <section className="mb-6">
        <SectionLabel>Show me</SectionLabel>
        <div className="px-5">
          <Chips
            label="Show me"
            options={SHOW_ME_OPTIONS}
            value={value.showMe}
            onChange={(showMe) => onChange({ ...value, showMe })}
          />
        </div>
      </section>

      {gender !== "man" ? (
        <div className="mx-5 mb-6 flex items-center gap-3.5 rounded-group bg-accent-tint p-4">
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-bold">Only women can see me</span>
            <span className="text-sub text-secondary">
              Your profile stays hidden from men.
            </span>
          </div>
          <Toggle
            label="Only women can see me"
            checked={value.womenOnlyVisibility}
            onChange={(womenOnlyVisibility) =>
              onChange({ ...value, womenOnlyVisibility })
            }
          />
        </div>
      ) : null}
    </>
  );
}
