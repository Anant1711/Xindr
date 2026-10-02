"use client";

import { useState, useTransition } from "react";
import { reportUser } from "@/app/actions/safety";
import { ListGroup } from "@/components/ios/ListGroup";
import { ListRow } from "@/components/ios/ListRow";
import { NavButton } from "@/components/ios/NavBar";
import { Sheet } from "@/components/ios/Sheet";
import { TextAreaRow } from "@/components/ios/TextField";
import { useToast } from "@/components/ios/Toast";
import { LIMITS } from "@/lib/constants";
import { REPORT_REASONS } from "@/lib/validation";

type Reason = (typeof REPORT_REASONS)[number];

const REASON_LABEL: Record<Reason, string> = {
  harassment: "Harassment",
  fake_profile: "Fake profile",
  inappropriate_message: "Inappropriate messages",
  unsafe_behavior: "Unsafe behaviour",
  other: "Something else",
};

type Props = {
  open: boolean;
  onClose: () => void;
  personId: string;
  name: string;
};

export function ReportSheet({ open, onClose, personId, name }: Props) {
  const toast = useToast();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setReason(null);
    setDetails("");
    setError(null);
    onClose();
  }

  function submit() {
    if (!reason) return;
    startTransition(async () => {
      const res = await reportUser({ reportedId: personId, reason, details });
      if (res.ok) {
        close();
        toast.show("Thanks. We'll review this.");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Report"
      action={
        <NavButton bold disabled={!reason || pending} onClick={submit}>
          Send
        </NavButton>
      }
    >
      <p className="mx-8 mb-4 text-sub text-secondary">
        What&apos;s wrong with {name}&apos;s profile or behaviour? They
        won&apos;t know you reported them.
      </p>
      <ListGroup header="Reason">
        {REPORT_REASONS.map((r) => (
          <ListRow
            key={r}
            title={REASON_LABEL[r]}
            selected={reason === r}
            role="radio"
            ariaChecked={reason === r}
            onClick={() => setReason(r)}
          />
        ))}
      </ListGroup>
      <ListGroup header="Details (optional)">
        <TextAreaRow
          id="report-details"
          label="Details"
          placeholder="Anything that helps us understand"
          maxLength={LIMITS.reportDetails}
          count={details.length}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </ListGroup>
      {error ? (
        <p role="alert" className="mx-8 -mt-6 mb-6 text-foot text-destructive">
          {error}
        </p>
      ) : null}
      <p className="mx-8 mb-8 text-foot text-secondary">
        If you feel unsafe, you can also block them. If you are in danger, call
        112.
      </p>
    </Sheet>
  );
}
