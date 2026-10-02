"use client";

import { useTransition } from "react";
import { unblock } from "@/app/actions/profile";
import { Button } from "@/components/ios/Button";
import { useToast } from "@/components/ios/Toast";

export function UnblockButton({
  personId,
  name,
}: {
  personId: string;
  name: string;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="small"
      variant="secondary"
      loading={pending}
      aria-label={`Unblock ${name}`}
      onClick={() =>
        startTransition(async () => {
          const res = await unblock(personId);
          toast.show(res.ok ? `${name} unblocked` : res.error);
        })
      }
    >
      Unblock
    </Button>
  );
}
