"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ios/Button";
import { useToast } from "@/components/ios/Toast";
import { SAFETY_LINE } from "@/lib/constants";
import type { Relationship } from "@/lib/relationship";
import { cancelRequest, respondToRequest, type ActionResult } from "./actions";

type Props = {
  personId: string;
  firstName: string;
  relationship: Relationship;
  slot: string | null;
};

const linkButton =
  "inline-flex h-[50px] w-full items-center justify-center rounded-button bg-accent text-body font-semibold text-white active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function BuddyActions({
  personId,
  firstName,
  relationship,
  slot,
}: Props) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"cancel" | "accept" | "decline" | null>(
    null,
  );

  function run(
    which: "cancel" | "accept" | "decline",
    action: () => Promise<ActionResult>,
    done: string,
  ) {
    setBusy(which);
    startTransition(async () => {
      const res = await action();
      setBusy(null);
      toast.show(res.ok ? done : res.error);
    });
  }

  let body: React.ReactNode;
  switch (relationship.kind) {
    case "matched":
      body = (
        <Link href={`/chats/${relationship.matchId}`} className={linkButton}>
          Message
        </Link>
      );
      break;
    case "sent":
      body = (
        <>
          <Button disabled>Request sent</Button>
          {slot ? (
            <p className="text-center text-foot text-secondary">For {slot}</p>
          ) : null}
          <Button
            variant="plain"
            loading={pending && busy === "cancel"}
            disabled={pending}
            onClick={() =>
              run(
                "cancel",
                () => cancelRequest(relationship.requestId, personId),
                "Request cancelled",
              )
            }
          >
            Cancel request
          </Button>
        </>
      );
      break;
    case "received":
      body = (
        <>
          <p className="text-center text-sub text-secondary">
            {firstName} wants to train{slot ? ` · ${slot}` : ""}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              loading={pending && busy === "decline"}
              disabled={pending}
              onClick={() =>
                run(
                  "decline",
                  () =>
                    respondToRequest(relationship.requestId, false, personId),
                  "Request declined",
                )
              }
            >
              Decline
            </Button>
            <Button
              loading={pending && busy === "accept"}
              disabled={pending}
              onClick={() =>
                run(
                  "accept",
                  () =>
                    respondToRequest(relationship.requestId, true, personId),
                  "Request accepted",
                )
              }
            >
              Accept
            </Button>
          </div>
        </>
      );
      break;
    default:
      body = (
        <Link href={`/people/${personId}/ask`} className={linkButton}>
          Ask to Train
        </Link>
      );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      {body}
      <p className="text-center text-foot text-secondary">{SAFETY_LINE}</p>
    </div>
  );
}
