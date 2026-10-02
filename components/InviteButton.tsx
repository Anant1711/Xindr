"use client";

import { Button } from "@/components/ios/Button";
import { useToast } from "@/components/ios/Toast";
import { shareInvite } from "@/lib/invite";

export function InviteButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  const toast = useToast();
  return (
    <Button variant={variant} onClick={() => shareInvite(toast.show)}>
      Invite a friend
    </Button>
  );
}
