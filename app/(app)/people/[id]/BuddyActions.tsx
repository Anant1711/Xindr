"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomBar } from "@/components/ios/BottomBar";
import { Button, buttonClass } from "@/components/ios/Button";
import { useToast } from "@/components/ios/Toast";
import { SAFETY_LINE } from "@/lib/constants";
import type { Relationship } from "@/lib/relationship";
import { cancelRequest, respondToRequest } from "@/app/actions/requests";

type Props = {
  personId: string;
  firstName: string;
  relationship: Relationship;
  slot: string | null;
};

const linkButton = buttonClass();

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

  const router = useRouter();

  function run(
    which: "cancel" | "accept" | "decline",
    action: () => Promise<
      { ok: true; matchId?: string | null } | { ok: false; error: string }
    >,
    done: string,
  ) {
    setBusy(which);
    startTransition(async () => {
      const res = await action();
      setBusy(null);
      toast.show(res.ok ? done : res.error);
      if (res.ok && res.matchId) router.push(`/chats/${res.matchId}`);
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
            <Button
              variant="outline"
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
    <>
      <p className="mx-5 text-center text-sub text-secondary">{SAFETY_LINE}</p>
      <BottomBar>{body}</BottomBar>
    </>
  );
}
