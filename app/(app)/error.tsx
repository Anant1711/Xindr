"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Button } from "@/components/ios/Button";
import { StateMessage } from "@/components/ios/StateMessage";

export default function AppError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="pt-safe pt-16">
      <StateMessage
        title="Couldn't load this"
        body="Check your connection and try again."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              startTransition(() => {
                router.refresh();
                reset();
              })
            }
          >
            Retry
          </Button>
        }
      />
    </div>
  );
}
