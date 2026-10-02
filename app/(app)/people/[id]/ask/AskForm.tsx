"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendRequest } from "@/app/actions/requests";
import { BottomBar } from "@/components/ios/BottomBar";
import { Button } from "@/components/ios/Button";
import { Checkmark } from "@/components/ios/icons";
import { SectionLabel } from "@/components/ios/ListGroup";
import { NavBar, NavButton } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { LIMITS, SAFETY_LINE } from "@/lib/constants";

type Props = {
  personId: string;
  name: string;
  overlap: boolean;
  slots: { iso: string; label: string }[];
};

export function AskForm({ personId, name, overlap, slots }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState(slots[0]?.iso ?? null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<{
    text: string;
    openChats: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const profileHref = `/people/${personId}`;

  // Slots are recomputed on the server after a refresh; keep the choice valid.
  const choice = slots.some((s) => s.iso === selected)
    ? selected
    : (slots[0]?.iso ?? null);

  function send() {
    if (!choice) return;
    setError(null);
    startTransition(async () => {
      const res = await sendRequest({ personId, proposedAt: choice, note });
      if (res.ok) {
        toast.show("Request sent");
        router.replace(profileHref);
        return;
      }
      switch (res.reason) {
        case "time_in_past":
          router.refresh();
          setError({ text: res.error, openChats: false });
          break;
        case "unavailable":
          toast.show(res.error);
          router.replace(profileHref);
          break;
        default:
          setError({ text: res.error, openChats: res.reason === "duplicate" });
      }
    });
  }

  return (
    <div className="min-h-dvh">
      <NavBar
        title="Ask to Train"
        left={<NavButton href={profileHref}>Cancel</NavButton>}
      />

      <div className="px-5 pt-2.5">
        <h1 className="font-display text-[28px] leading-[30px]">Pick a time</h1>
        <p className="mt-1.5 text-[14px] text-secondary">
          {overlap
            ? `Suggested from times you and ${name} both train.`
            : `Your usual days don't overlap yet. These are ${name}'s usual days.`}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Suggested times"
        className="flex flex-col gap-2.5 px-5 pt-5"
      >
        {slots.map((s) => {
          const on = s.iso === choice;
          return (
            <button
              key={s.iso}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(s.iso)}
              className={`flex min-h-[56px] items-center justify-between rounded-2xl border-[1.5px] px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                on
                  ? "border-accent bg-accent-tint"
                  : "border-separator bg-white"
              }`}
            >
              <span className="text-[15px] font-bold">{s.label}</span>
              <span
                aria-hidden="true"
                className={`flex size-[26px] shrink-0 items-center justify-center rounded-full ${
                  on
                    ? "bg-accent text-white"
                    : "border-[1.5px] border-separator"
                }`}
              >
                {on ? <Checkmark size={14} strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <section className="pt-6">
        <SectionLabel>
          <label htmlFor="ask-note">Note (optional)</label>
        </SectionLabel>
        <div className="mx-5 rounded-[14px] bg-surface px-4 pt-3.5 pb-2 focus-within:ring-2 focus-within:ring-accent">
          <textarea
            id="ask-note"
            rows={3}
            maxLength={LIMITS.note}
            placeholder="Hi, I train around the same time."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-secondary"
          />
          <p className="text-right text-foot text-secondary" aria-live="polite">
            {note.length}/{LIMITS.note}
          </p>
        </div>
      </section>

      {error ? (
        <p role="alert" className="mx-5 mt-4 text-sub text-destructive">
          {error.text}{" "}
          {error.openChats ? (
            <Link href="/chats" className="font-semibold text-accent underline">
              Open Chats
            </Link>
          ) : null}
        </p>
      ) : null}

      <p className="mx-5 mt-4 text-[12.5px] leading-[18px] text-secondary">
        {SAFETY_LINE}
      </p>

      <BottomBar>
        <Button onClick={send} disabled={!choice} loading={pending}>
          Send Request
        </Button>
      </BottomBar>
    </div>
  );
}
