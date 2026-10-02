"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestArea, updateDetails } from "@/app/actions/profile";
import { BottomBar } from "@/components/ios/BottomBar";
import { Button } from "@/components/ios/Button";
import { BackButton, NavBar } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { AboutYouFields } from "@/components/profile/AboutYouFields";
import type { AboutYouDraft, Area, Gym } from "@/components/profile/types";
import { aboutYouSchema } from "@/lib/validation";

type Props = { initial: AboutYouDraft; areas: Area[]; gyms: Gym[] };

export function DetailsForm({ initial, areas, gyms }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const parsed = aboutYouSchema.safeParse(draft);

  function save() {
    if (!parsed.success) return;
    setError(null);
    startTransition(async () => {
      const res = await updateDetails(parsed.data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.show("Saved");
      router.push("/profile");
    });
  }

  return (
    <main className="min-h-dvh">
      <NavBar
        left={<BackButton href="/profile" label="Back to Profile" />}
        title="My details"
      />
      <h1 className="sr-only">My details</h1>
      <div className="pt-3">
        <AboutYouFields
          value={draft}
          onChange={setDraft}
          areas={areas}
          gyms={gyms}
          onRequestArea={requestArea}
        />
      </div>
      {error ? (
        <p role="alert" className="mx-5 text-sub text-destructive">
          {error}
        </p>
      ) : null}
      <BottomBar>
        <Button onClick={save} disabled={!parsed.success} loading={pending}>
          Save
        </Button>
      </BottomBar>
    </main>
  );
}
