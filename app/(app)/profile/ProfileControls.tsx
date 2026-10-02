"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendFeedback, setPaused } from "@/app/actions/profile";
import { ActionSheet } from "@/components/ios/ActionSheet";
import { Button } from "@/components/ios/Button";
import { ListRow } from "@/components/ios/ListRow";
import { NavButton } from "@/components/ios/NavBar";
import { Sheet } from "@/components/ios/Sheet";
import { useToast } from "@/components/ios/Toast";
import { Toggle } from "@/components/ios/Toggle";
import { LIMITS } from "@/lib/constants";
import { shareInvite } from "@/lib/invite";

export function PauseToggle({ paused: initial }: { paused: boolean }) {
  const toast = useToast();
  const [paused, setLocal] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Toggle
      label="Pause my profile"
      checked={paused}
      disabled={pending}
      onChange={(next) => {
        setLocal(next);
        startTransition(async () => {
          const res = await setPaused(next);
          if (!res.ok) {
            setLocal(!next);
            toast.show(res.error);
          } else {
            toast.show(
              next
                ? "You're hidden from Nearby"
                : "You're visible in Nearby again",
            );
          }
        });
      }}
    />
  );
}

export function InviteRow() {
  const toast = useToast();
  return (
    <ListRow
      title="Invite a friend"
      chevron
      onClick={() => shareInvite(toast.show)}
    />
  );
}

export function FeedbackRow() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
  }

  function submit() {
    startTransition(async () => {
      const res = await sendFeedback(message);
      if (res.ok) {
        setMessage("");
        close();
        toast.show("Thanks for the feedback");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <ListRow title="Send feedback" chevron onClick={() => setOpen(true)} />
      <Sheet
        open={open}
        onClose={close}
        title="Feedback"
        action={
          <NavButton
            bold
            disabled={!message.trim() || pending}
            onClick={submit}
          >
            Send
          </NavButton>
        }
      >
        <div className="px-5 pb-6">
          <label htmlFor="feedback" className="text-sub text-secondary">
            What&apos;s working, what isn&apos;t, or a bug you found.
          </label>
          <div className="mt-3 rounded-[14px] bg-surface px-4 pt-3.5 pb-2 focus-within:ring-2 focus-within:ring-accent">
            <textarea
              id="feedback"
              data-autofocus
              rows={5}
              maxLength={LIMITS.feedback}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none bg-transparent text-[15px] outline-none"
            />
            <p className="text-right text-foot text-secondary">
              {message.length}/{LIMITS.feedback}
            </p>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sub text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}

export function DeleteAccountRow() {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  function deleteAccount() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/account/delete", { method: "POST" });
        if (!res.ok) throw new Error();
        router.replace("/login?deleted=1");
        router.refresh();
      } catch {
        toast.show("Couldn't delete your account. Please try again.");
      }
    });
  }

  return (
    <>
      {pending ? (
        <div className="flex min-h-[48px] items-center px-4">
          <Button
            variant="destructive-plain"
            size="small"
            loading
            className="-ml-5"
          >
            Deleting
          </Button>
        </div>
      ) : (
        <ListRow
          title="Delete my account"
          tone="destructive"
          onClick={() => setConfirm(true)}
        />
      )}
      <ActionSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete your account?"
        message="This permanently erases your profile, requests, chats and blocks. It can't be undone."
        actions={[
          {
            label: "Delete my account",
            destructive: true,
            onSelect: deleteAccount,
          },
        ]}
      />
    </>
  );
}
