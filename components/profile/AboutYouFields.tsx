"use client";

import { useState } from "react";
import { DayPills } from "@/components/ios/DayPills";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { Segmented } from "@/components/ios/Segmented";
import { Sheet } from "@/components/ios/Sheet";
import { TextFieldRow } from "@/components/ios/TextField";
import { LIMITS } from "@/lib/constants";
import { AreaRequestForm } from "./AreaRequestForm";
import {
  GENDER_OPTIONS,
  LEVEL_OPTIONS,
  TIME_OPTIONS,
  type AboutYouDraft,
  type Area,
  type Gym,
} from "./types";

type Props = {
  value: AboutYouDraft;
  onChange: (next: AboutYouDraft) => void;
  areas: Area[];
  gyms: Gym[];
  /** Server action that records a "my area isn't listed" request. */
  onRequestArea: (message: string) => Promise<{ ok: boolean }>;
};

export function AboutYouFields({
  value,
  onChange,
  areas,
  gyms,
  onRequestArea,
}: Props) {
  const [sheet, setSheet] = useState<"area" | "gym" | "request" | null>(null);
  const set = <K extends keyof AboutYouDraft>(key: K, v: AboutYouDraft[K]) =>
    onChange({ ...value, [key]: v });

  const area = areas.find((a) => a.id === value.areaId);
  const areaGyms = gyms.filter((g) => g.area_id === value.areaId);
  const gym = areaGyms.find((g) => g.id === value.gymId);

  function toggleDay(day: number) {
    const days = value.trainingDays.includes(day)
      ? value.trainingDays.filter((d) => d !== day)
      : [...value.trainingDays, day];
    set("trainingDays", days);
  }

  return (
    <>
      <ListGroup>
        <TextFieldRow
          id="first-name"
          label="First name"
          placeholder="Priya"
          autoComplete="given-name"
          maxLength={LIMITS.firstName}
          value={value.firstName}
          onChange={(e) => set("firstName", e.target.value)}
        />
        <TextFieldRow
          id="last-initial"
          label="Last initial"
          placeholder="S"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={1}
          value={value.lastInitial}
          onChange={(e) =>
            set(
              "lastInitial",
              e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase(),
            )
          }
        />
      </ListGroup>

      <ListGroup header="Gender">
        <div className="px-4 py-3">
          <Segmented
            label="Gender"
            options={GENDER_OPTIONS}
            value={value.gender}
            onChange={(v) => set("gender", v)}
          />
        </div>
      </ListGroup>

      <ListGroup header="Level">
        <div className="px-4 py-3">
          <Segmented
            label="Level"
            options={LEVEL_OPTIONS}
            value={value.level}
            onChange={(v) => set("level", v)}
          />
        </div>
      </ListGroup>

      <ListGroup footer="Only your area is shown to others, never your exact location.">
        <ListRow
          title="Area"
          detail={area?.name ?? "Choose"}
          chevron
          onClick={() => setSheet("area")}
        />
        <ListRow
          title="Gym"
          detail={!area ? "Choose area first" : (gym?.name ?? "Not listed")}
          chevron
          disabled={!area}
          onClick={() => setSheet("gym")}
        />
      </ListGroup>

      <ListGroup header="Usually trains">
        <div className="px-4 py-3">
          <Segmented
            label="Usually trains"
            options={TIME_OPTIONS}
            value={value.timeOfDay}
            onChange={(v) => set("timeOfDay", v)}
          />
        </div>
      </ListGroup>

      <ListGroup header="Days">
        <div className="px-4 py-3.5">
          <DayPills
            label="Training days"
            tone="accent"
            days={value.trainingDays}
            onToggle={toggleDay}
          />
        </div>
      </ListGroup>

      <ListGroup header="Focus (optional)">
        <TextFieldRow
          id="focus"
          label="Focus"
          placeholder="Strength, general fitness"
          maxLength={LIMITS.focus}
          value={value.focus}
          onChange={(e) => set("focus", e.target.value)}
        />
      </ListGroup>

      <Sheet
        open={sheet === "area"}
        onClose={() => setSheet(null)}
        title="Area"
      >
        <ListGroup>
          {areas.map((a) => (
            <ListRow
              key={a.id}
              title={a.name}
              selected={a.id === value.areaId}
              role="radio"
              ariaChecked={a.id === value.areaId}
              onClick={() => {
                onChange({
                  ...value,
                  areaId: a.id,
                  gymId: gyms.some(
                    (g) => g.id === value.gymId && g.area_id === a.id,
                  )
                    ? value.gymId
                    : null,
                });
                setSheet(null);
              }}
            />
          ))}
        </ListGroup>
        <ListGroup>
          <ListRow
            title="My area isn't listed"
            tone="accent"
            onClick={() => setSheet("request")}
          />
        </ListGroup>
      </Sheet>

      <Sheet
        open={sheet === "request"}
        onClose={() => setSheet(null)}
        title="Your Area"
      >
        <AreaRequestForm
          onSubmit={onRequestArea}
          onDone={() => setSheet(null)}
        />
      </Sheet>

      <Sheet open={sheet === "gym"} onClose={() => setSheet(null)} title="Gym">
        <ListGroup footer="Don't see your gym? Choose Not listed. You can change it later.">
          {areaGyms.map((g) => (
            <ListRow
              key={g.id}
              title={g.name}
              selected={g.id === value.gymId}
              role="radio"
              ariaChecked={g.id === value.gymId}
              onClick={() => {
                set("gymId", g.id);
                setSheet(null);
              }}
            />
          ))}
          <ListRow
            title="Not listed"
            selected={value.gymId === null}
            role="radio"
            ariaChecked={value.gymId === null}
            onClick={() => {
              set("gymId", null);
              setSheet(null);
            }}
          />
        </ListGroup>
      </Sheet>
    </>
  );
}
