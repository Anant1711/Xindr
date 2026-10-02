"use client";

import { useState, useTransition } from "react";
import { ActionSheet } from "@/components/ios/ActionSheet";
import { Ellipsis } from "@/components/ios/icons";
import { BackButton, NavBar, NavButton } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { ReportSheet } from "@/components/ReportSheet";
import { blockUser } from "@/app/actions/safety";

export function BuddyNav({
  personId,
  name,
}: {
  personId: string;
  name: string;
}) {
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [report, setReport] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <>
      <NavBar
        left={<BackButton fallbackHref="/nearby" />}
        right={
          <NavButton ariaLabel="More options" onClick={() => setMenu(true)}>
            <Ellipsis />
          </NavButton>
        }
      />

      <ActionSheet
        open={menu}
        onClose={() => setMenu(false)}
        actions={[
          { label: "Report…", onSelect: () => setReport(true) },
          {
            label: "Block",
            destructive: true,
            onSelect: () => setConfirmBlock(true),
          },
        ]}
      />

      <ActionSheet
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        title={`Block ${name}?`}
        message="You won't see each other in Nearby, and any request or chat between you ends. They won't be told."
        actions={[
          {
            label: "Block",
            destructive: true,
            onSelect: () =>
              startTransition(async () => {
                const res = await blockUser(personId);
                // On success the action redirects to Nearby.
                if (!res.ok) toast.show(res.error);
              }),
          },
        ]}
      />

      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        personId={personId}
        name={name}
      />
    </>
  );
}
