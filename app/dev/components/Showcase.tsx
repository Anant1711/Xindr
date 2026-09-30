"use client";

import { useState } from "react";
import { ActionSheet } from "@/components/ios/ActionSheet";
import { Avatar } from "@/components/ios/Avatar";
import { Button } from "@/components/ios/Button";
import { DayPills } from "@/components/ios/DayPills";
import { Ellipsis } from "@/components/ios/icons";
import { LargeTitle } from "@/components/ios/LargeTitle";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { BackButton, NavBar, NavButton } from "@/components/ios/NavBar";
import { Segmented } from "@/components/ios/Segmented";
import { Sheet } from "@/components/ios/Sheet";
import { SkeletonList } from "@/components/ios/Skeleton";
import { StateMessage } from "@/components/ios/StateMessage";
import { TabBar } from "@/components/ios/TabBar";
import { TextAreaRow, TextFieldRow } from "@/components/ios/TextField";
import { useToast } from "@/components/ios/Toast";
import { Toggle } from "@/components/ios/Toggle";
import { SAFETY_LINE } from "@/lib/constants";

const levels = [
  { value: "all", label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "pro", label: "Pro" },
] as const;

const people = [
  { id: "a1f0c3", first: "Priya", initial: "S", sub: "Beginner · Same gym" },
  {
    id: "b27d91",
    first: "Rohan",
    initial: "K",
    sub: "Intermediate · Same area",
  },
  { id: "c9e412", first: "Aisha", initial: "M", sub: "Beginner · 1.2 km" },
  { id: "d55a07", first: "Vikram", initial: "P", sub: "Pro · 3.4 km" },
];

const slots = ["Today, 6:30 PM", "Tomorrow, 6:30 PM", "Saturday, 7:00 AM"];

export function Showcase() {
  const [level, setLevel] = useState<(typeof levels)[number]["value"]>("all");
  const [time, setTime] = useState<"morning" | "evening">("evening");
  const [womenOnly, setWomenOnly] = useState(true);
  const [paused, setPaused] = useState(false);
  const [days, setDays] = useState<number[]>([0, 2, 4]);
  const [slot, setSlot] = useState(0);
  const [note, setNote] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const toast = useToast();

  return (
    <div className="pb-[120px]">
      <NavBar
        title="Components"
        left={<BackButton label="Nearby" href="/" />}
        right={
          <NavButton ariaLabel="More" onClick={() => setActionsOpen(true)}>
            <Ellipsis />
          </NavButton>
        }
      />
      <LargeTitle>Nearby</LargeTitle>

      <div className="px-4 pb-5">
        <Segmented
          label="Level"
          options={levels}
          value={level}
          onChange={setLevel}
        />
      </div>

      <ListGroup header="Near Pimple Saudagar">
        {people.map((p) => (
          <ListRow
            key={p.id}
            tall
            chevron
            href="#"
            leading={
              <Avatar id={p.id} firstName={p.first} lastInitial={p.initial} />
            }
            title={`${p.first} ${p.initial}.`}
            subtitle={p.sub}
          />
        ))}
      </ListGroup>

      <section className="mb-8">
        <h2 className="mx-8 mb-1.5 text-foot text-secondary uppercase">
          Loading state
        </h2>
        <SkeletonList rows={3} />
      </section>

      <ListGroup header="Buddy profile">
        <div className="flex flex-col items-center py-6">
          <Avatar id="a1f0c3" firstName="Priya" lastInitial="S" size={96} />
          <p className="mt-3 text-[22px] font-bold">Priya S.</p>
          <p className="text-sub text-secondary">
            Beginner · Woman · 1.2 km away
          </p>
        </div>
      </ListGroup>

      <ListGroup>
        <ListRow title="Usually trains" detail="Evenings" />
        <ListRow title="Focus" detail="Strength" />
        <ListRow title="Gym" detail="Not set" />
      </ListGroup>

      <ListGroup header="Your overlap" footer="3 shared evenings a week">
        <div className="px-4 py-3.5">
          <DayPills label="Shared days" days={[0, 2, 4]} />
        </div>
      </ListGroup>

      <ListGroup header="About you (editable pills and fields)">
        <TextFieldRow
          id="dev-first"
          label="First name"
          placeholder="Priya"
          autoComplete="given-name"
        />
        <TextFieldRow
          id="dev-initial"
          label="Last initial"
          placeholder="S"
          maxLength={1}
        />
        <div className="px-4 py-3">
          <Segmented
            label="Usually trains"
            options={[
              { value: "morning", label: "Morning" },
              { value: "evening", label: "Evening" },
            ]}
            value={time}
            onChange={setTime}
          />
        </div>
        <div className="px-4 py-3">
          <DayPills
            label="Training days"
            tone="accent"
            days={days}
            onToggle={(d) =>
              setDays((cur) =>
                cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d],
              )
            }
          />
        </div>
      </ListGroup>

      <ListGroup footer="Your profile stays hidden from men.">
        <ListRow
          title="Only women can see me"
          trailing={
            <Toggle
              label="Only women can see me"
              checked={womenOnly}
              onChange={setWomenOnly}
            />
          }
        />
        <ListRow
          title="Pause my profile"
          trailing={
            <Toggle
              label="Pause my profile"
              checked={paused}
              onChange={setPaused}
            />
          }
        />
        <ListRow
          title="Disabled toggle"
          trailing={
            <Toggle
              label="Disabled"
              checked={false}
              onChange={() => {}}
              disabled
            />
          }
        />
      </ListGroup>

      <ListGroup header="Suggested times" footer={SAFETY_LINE}>
        {slots.map((s, i) => (
          <ListRow
            key={s}
            title={s}
            selected={slot === i}
            onClick={() => setSlot(i)}
            role="radio"
            ariaChecked={slot === i}
          />
        ))}
      </ListGroup>

      <ListGroup header="Note (optional)">
        <TextAreaRow
          id="dev-note"
          label="Note"
          placeholder="Add a note"
          maxLength={200}
          count={note.length}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </ListGroup>

      <ListGroup header="Messages">
        <ListRow
          tall
          bold
          chevron
          href="#"
          leading={<Avatar id="b27d91" firstName="Rohan" lastInitial="K" />}
          title="Rohan K."
          subtitle="See you at 6:30"
          detail="9:41 AM"
        />
        <ListRow
          tall
          dimmed
          chevron
          href="#"
          leading={<Avatar id="d55a07" firstName="Vikram" lastInitial="P" />}
          title="Vikram P."
          subtitle="Ended"
          detail="Yesterday"
        />
      </ListGroup>

      <ListGroup>
        <ListRow
          title="Sign out"
          tone="accent"
          onClick={() => toast.show("Signed out")}
        />
        <ListRow
          title="Delete my account"
          tone="destructive"
          onClick={() => {}}
        />
      </ListGroup>

      <div className="mb-8 flex flex-col gap-3 px-4">
        <Button onClick={() => toast.show("Request sent")}>Ask to Train</Button>
        <Button variant="secondary">Message</Button>
        <Button disabled>Request sent</Button>
        <Button loading>Loading</Button>
        <Button variant="plain">Cancel request</Button>
        <div className="flex gap-3">
          <Button variant="secondary">Decline</Button>
          <Button>Accept</Button>
        </div>
        <Button variant="destructive">Delete my account</Button>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
        <Button variant="secondary" onClick={() => setActionsOpen(true)}>
          Open action sheet
        </Button>
      </div>

      <ListGroup header="Empty state">
        <StateMessage
          title="No one nearby yet"
          body="It grows as friends join. Invite someone you train with."
          action={<Button>Invite a friend</Button>}
        />
      </ListGroup>

      <ListGroup header="Error state">
        <StateMessage
          title="Couldn't load"
          body="Check your connection and try again."
          action={<Button variant="secondary">Retry</Button>}
        />
      </ListGroup>

      <ActionSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        actions={[
          { label: "Report…", onSelect: () => setSheetOpen(true) },
          {
            label: "Block",
            destructive: true,
            onSelect: () => toast.show("Blocked"),
          },
        ]}
      />

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Report"
        action={
          <NavButton
            bold
            onClick={() => {
              setSheetOpen(false);
              toast.show("Thanks. We'll review this.");
            }}
          >
            Submit
          </NavButton>
        }
      >
        <ListGroup header="Reason">
          <ListRow title="Harassment" selected onClick={() => {}} />
          <ListRow title="Fake profile" onClick={() => {}} />
          <ListRow title="Other" onClick={() => {}} />
        </ListGroup>
      </Sheet>

      <TabBar chatsBadge={3} />
    </div>
  );
}
