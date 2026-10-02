"use client";

import { useState } from "react";
import { DayPills } from "@/components/ios/DayPills";
import { ListGroup, SectionLabel } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { Chips } from "@/components/ios/Chips";
import { Sheet } from "@/components/ios/Sheet";
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
  /** Receives an updater so rapid changes never overwrite each other. */
  onChange: (update: (prev: AboutYouDraft) => AboutYouDraft) => void;
  areas: Area[];
  gyms: Gym[];
  /** Server action that records a "my area isn't listed" request. */
  onRequestArea: (message: string) => Promise<{ ok: boolean }>;
};

const inputClass =
  "h-[52px] w-full rounded-[14px] bg-surface px-4 text-[16px] text-label outline-none placeholder:text-secondary focus:ring-2 focus:ring-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <SectionLabel>{label}</SectionLabel>
      <div className="px-5">{children}</div>
    </section>
  );
}

export function AboutYouFields({
  value,
  onChange,
  areas,
  gyms,
  onRequestArea,
}: Props) {
  const [sheet, setSheet] = useState<"area" | "gym" | "request" | null>(null);
  const set = <K extends keyof AboutYouDraft>(key: K, v: AboutYouDraft[K]) =>
    onChange((prev) => ({ ...prev, [key]: v }));

  const area = areas.find((a) => a.id === value.areaId);
  const areaGyms = gyms.filter((g) => g.area_id === value.areaId);
  const gym = areaGyms.find((g) => g.id === value.gymId);

  function toggleDay(day: number) {
    onChange((prev) => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter((d) => d !== day)
        : [...prev.trainingDays, day],
    }));
  }

  return (
    <>
      <Field label="Your name">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label htmlFor="first-name" className="sr-only">
              First name
            </label>
            <input
              id="first-name"
              placeholder="First name"
              autoComplete="given-name"
              maxLength={LIMITS.firstName}
              value={value.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="last-name" className="sr-only">
              Last name
            </label>
            <input
              id="last-name"
              placeholder="Last name"
              autoComplete="family-name"
              maxLength={LIMITS.lastName}
              value={value.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="mt-2 text-sub text-secondary">
          People nearby see your first name and last initial. Your full last
          name is shown only to people you&apos;ve matched with.
        </p>
      </Field>

      <Field label="I am">
        <Chips
          label="Gender"
          options={GENDER_OPTIONS}
          value={value.gender}
          onChange={(v) => set("gender", v)}
        />
      </Field>

      <Field label="My level">
        <Chips
          label="Level"
          options={LEVEL_OPTIONS}
          value={value.level}
          onChange={(v) => set("level", v)}
        />
      </Field>

      <ListGroup
        header="Where I train"
        footer="Only your area is shown to others, never your exact location."
      >
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

      <Field label="I usually train">
        <Chips
          label="Usually trains"
          options={TIME_OPTIONS}
          value={value.timeOfDay}
          onChange={(v) => set("timeOfDay", v)}
        />
      </Field>

      <Field label="Days I train">
        <DayPills
          label="Training days"
          tone="accent"
          days={value.trainingDays}
          onToggle={toggleDay}
        />
      </Field>

      <Field label="Focus (optional)">
        <label htmlFor="focus" className="sr-only">
          Focus
        </label>
        <input
          id="focus"
          placeholder="Strength, general fitness"
          maxLength={LIMITS.focus}
          value={value.focus}
          onChange={(e) => set("focus", e.target.value)}
          className={inputClass}
        />
      </Field>

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
                onChange((prev) => ({
                  ...prev,
                  areaId: a.id,
                  gymId: gyms.some(
                    (g) => g.id === prev.gymId && g.area_id === a.id,
                  )
                    ? prev.gymId
                    : null,
                }));
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
