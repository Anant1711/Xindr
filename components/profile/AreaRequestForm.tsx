"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ios/Button";
import { ListGroup } from "@/components/ios/ListGroup";
import { StateMessage } from "@/components/ios/StateMessage";
import { TextFieldRow } from "@/components/ios/TextField";

type Props = {
  onSubmit: (message: string) => Promise<{ ok: boolean }>;
  onDone: () => void;
};

export function AreaRequestForm({ onSubmit, onDone }: Props) {
  const [area, setArea] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <StateMessage
        title="Thank you"
        body="We use these requests to decide where to open next."
        action={
          <Button variant="secondary" onClick={onDone}>
            Done
          </Button>
        }
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await onSubmit(area);
          setError(!res.ok);
          if (res.ok) setSent(true);
        });
      }}
    >
      <ListGroup footer="Tell us where you train. We only open areas once there are enough people nearby.">
        <TextFieldRow
          id="area-request"
          label="Area"
          placeholder="e.g. Ravet"
          maxLength={100}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          data-autofocus
        />
      </ListGroup>
      {error ? (
        <p role="alert" className="mx-8 -mt-6 mb-6 text-foot text-destructive">
          Couldn&apos;t send. Please try again.
        </p>
      ) : null}
      <div className="px-4 pb-6">
        <Button type="submit" loading={pending} disabled={!area.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
}
