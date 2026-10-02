"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendRequest } from "@/app/actions/requests";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { NavBar, NavButton } from "@/components/ios/NavBar";
import { TextAreaRow } from "@/components/ios/TextField";
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
    <div className="pb-safe min-h-dvh pb-10">
      <NavBar
        modal
        title="Ask to Train"
        left={<NavButton href={profileHref}>Cancel</NavButton>}
        right={
          <NavButton bold disabled={!choice || pending} onClick={send}>
            Send
          </NavButton>
        }
      />

      <p className="mx-8 mt-2 mb-5 text-sub text-secondary">
        Suggest a time to train with {name}
      </p>

      <ListGroup
        header="Suggested times"
        footer={
          overlap
            ? undefined
            : "Your usual days don't overlap yet. These are their usual days."
        }
      >
        {slots.map((s) => (
          <ListRow
            key={s.iso}
            title={s.label}
            selected={s.iso === choice}
            role="radio"
            ariaChecked={s.iso === choice}
            onClick={() => setSelected(s.iso)}
          />
        ))}
      </ListGroup>

      <ListGroup header="Note (optional)">
        <TextAreaRow
          id="ask-note"
          label="Note"
          placeholder="e.g. I'm working on squats, happy to spot"
          maxLength={LIMITS.note}
          count={note.length}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </ListGroup>

      {error ? (
        <div
          role="alert"
          className="mx-8 -mt-6 mb-6 text-foot text-destructive"
        >
          {error.text}{" "}
          {error.openChats ? (
            <Link href="/chats" className="text-accent underline">
              Open Chats
            </Link>
          ) : null}
        </div>
      ) : null}

      <p className="mx-8 text-center text-foot text-secondary">{SAFETY_LINE}</p>
    </div>
  );
}
