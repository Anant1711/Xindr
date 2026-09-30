"use client";

import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { Segmented } from "@/components/ios/Segmented";
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
      <ListGroup header="Show me">
        <div className="px-4 py-3">
          <Segmented
            label="Show me"
            options={SHOW_ME_OPTIONS}
            value={value.showMe}
            onChange={(showMe) => onChange({ ...value, showMe })}
          />
        </div>
      </ListGroup>

      {gender !== "man" ? (
        <ListGroup footer="Your profile stays hidden from men.">
          <ListRow
            title="Only women can see me"
            trailing={
              <Toggle
                label="Only women can see me"
                checked={value.womenOnlyVisibility}
                onChange={(womenOnlyVisibility) =>
                  onChange({ ...value, womenOnlyVisibility })
                }
              />
            }
          />
        </ListGroup>
      ) : null}
    </>
  );
}
