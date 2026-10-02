"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePreferences } from "@/app/actions/profile";
import { BottomBar } from "@/components/ios/BottomBar";
import { Button } from "@/components/ios/Button";
import { BackButton, NavBar } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { PreferencesFields } from "@/components/profile/PreferencesFields";
import type { Gender, PreferencesDraft } from "@/components/profile/types";

export function PreferencesForm({
  gender,
  initial,
}: {
  gender: Gender;
  initial: PreferencesDraft;
}) {
  const router = useRouter();
  const toast = useToast();
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updatePreferences(prefs);
      if (!res.ok) {
        toast.show(res.error);
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
        title="Preferences"
      />
      <h1 className="px-5 pt-2 pb-6 font-display text-[28px] leading-[30px]">
        Who you see
      </h1>
      <PreferencesFields value={prefs} onChange={setPrefs} gender={gender} />
      <BottomBar>
        <Button onClick={save} loading={pending}>
          Save
        </Button>
      </BottomBar>
    </main>
  );
}
