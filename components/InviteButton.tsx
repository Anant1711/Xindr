"use client";

import { Button } from "@/components/ios/Button";
import { useToast } from "@/components/ios/Toast";
import { APP_NAME } from "@/lib/constants";
import { publicEnv } from "@/lib/env";

const MESSAGE =
  "I'm using Gym Buddy to find training partners nearby. Join me:";

export function InviteButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  const toast = useToast();

  async function invite() {
    const url = publicEnv.NEXT_PUBLIC_APP_URL;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: APP_NAME, text: MESSAGE, url });
        return;
      } catch (err) {
        // The person closed the share sheet.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${MESSAGE} ${url}`);
      toast.show("Link copied");
    } catch {
      toast.show(`Share this link: ${url}`);
    }
  }

  return (
    <Button variant={variant} onClick={invite}>
      Invite a friend
    </Button>
  );
}
