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
    <div className="ios-row-divider hairline-b px-4 py-3.5">
      <Link href={`/people/${personId}`} className="flex items-center gap-3">
        <Avatar
          id={personId}
          firstName={firstName}
          lastInitial={lastInitial}
          size={44}
        />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">
            {displayName(firstName, lastInitial)}
          </p>
          <p className="truncate text-sub text-secondary">
            Wants to train · {slot}
          </p>
        </div>
      </Link>
      {note ? (
        // Plain text only; never rendered as HTML.
        <p className="mt-2.5 rounded-[10px] bg-bg px-3 py-2 text-sub break-words whitespace-pre-wrap">
          {note}
        </p>
      ) : null}
      <div className="mt-3 flex gap-3">
        <Button
          size="small"
          variant="secondary"
          className="flex-1"
          disabled={pending}
          loading={busy === "decline"}
          onClick={() => respond(false)}
        >
          Decline
        </Button>
        <Button
          size="small"
          className="flex-1"
          disabled={pending}
          loading={busy === "accept"}
          onClick={() => respond(true)}
        >
          Accept
        </Button>
      </div>
    </div>
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
    <div className="flex items-center gap-3 pl-4">
      <Link href={`/people/${personId}`} className="shrink-0">
        <Avatar id={personId} firstName={firstName} lastInitial={lastInitial} />
      </Link>
      <div className="ios-row-divider hairline-b flex min-h-[60px] min-w-0 flex-1 items-center gap-2 py-2 pr-3">
        <Link href={`/people/${personId}`} className="min-w-0 flex-1">
          <p className="truncate text-body">
            {displayName(firstName, lastInitial)}
          </p>
          <p className="truncate text-sub text-secondary">{slot}</p>
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
      </div>
    </div>
  );
}
