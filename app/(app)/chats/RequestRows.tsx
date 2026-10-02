"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelRequest, respondToRequest } from "@/app/actions/requests";
import { Avatar } from "@/components/ios/Avatar";
import { Button } from "@/components/ios/Button";
import { useToast } from "@/components/ios/Toast";
import { displayName } from "@/lib/format";

type Person = { personId: string; firstName: string; lastInitial: string };

export function RequestCard({
  requestId,
  personId,
  firstName,
  lastInitial,
  slot,
  note,
}: Person & { requestId: string; slot: string; note: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  function respond(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    startTransition(async () => {
      const res = await respondToRequest(requestId, accept, personId);
      setBusy(null);
      if (!res.ok) {
        toast.show(res.error);
        return;
      }
      if (accept && res.matchId) router.push(`/chats/${res.matchId}`);
      else toast.show("Request declined");
    });
  }

  return (
    <li className="flex flex-col gap-3.5 rounded-group bg-accent-tint p-4">
      <Link
        href={`/people/${personId}`}
        className="flex items-center gap-3 rounded-xl"
      >
        <Avatar
          id={personId}
          firstName={firstName}
          lastInitial={lastInitial}
          size={44}
        />
        <div className="min-w-0">
          <p className="truncate font-display text-[16px] leading-[18px]">
            {displayName(firstName, lastInitial)}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-secondary">
            Wants to train · {slot}
          </p>
        </div>
      </Link>
      {note ? (
        // Plain text only; never rendered as HTML.
        <p className="rounded-xl bg-white px-3 py-2 text-[14px] break-words whitespace-pre-wrap">
          {note}
        </p>
      ) : null}
      <div className="flex gap-2.5">
        <Button
          size="small"
          className="flex-1"
          disabled={pending}
          loading={busy === "accept"}
          onClick={() => respond(true)}
        >
          Accept
        </Button>
        <Button
          size="small"
          variant="outline"
          className="flex-1"
          disabled={pending}
          loading={busy === "decline"}
          onClick={() => respond(false)}
        >
          Decline
        </Button>
      </div>
    </li>
  );
}

export function WaitingRow({
  requestId,
  personId,
  firstName,
  lastInitial,
  slot,
}: Person & { requestId: string; slot: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <Link
        href={`/people/${personId}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar
          id={personId}
          firstName={firstName}
          lastInitial={lastInitial}
          size={46}
        />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] leading-[17px]">
            {displayName(firstName, lastInitial)}
          </p>
          <p className="mt-0.5 truncate text-[13.5px] text-secondary">
            Waiting · {slot}
          </p>
        </div>
      </Link>
      <Button
        size="small"
        variant="plain"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await cancelRequest(requestId, personId);
            toast.show(res.ok ? "Request cancelled" : res.error);
          })
        }
      >
        Cancel
      </Button>
    </li>
  );
}
