"use client";

import { useState, useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ios/Button";
import { ChevronLeft } from "@/components/ios/icons";
import { ListGroup } from "@/components/ios/ListGroup";
import { NavBar, NavButton } from "@/components/ios/NavBar";
import { AboutYouFields } from "@/components/profile/AboutYouFields";
import { PreferencesFields } from "@/components/profile/PreferencesFields";
import type {
  AboutYouDraft,
  Area,
  Gym,
  PreferencesDraft,
} from "@/components/profile/types";
import { aboutYouSchema } from "@/lib/validation";
import { createProfile, requestArea } from "./actions";

const EMPTY: AboutYouDraft = {
  firstName: "",
  lastInitial: "",
  gender: null,
  level: null,
  areaId: null,
  gymId: null,
  timeOfDay: null,
  trainingDays: [],
  focus: "",
};

export function Onboarding({ areas, gyms }: { areas: Area[]; gyms: Gym[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [about, setAbout] = useState<AboutYouDraft>(EMPTY);
  const [prefs, setPrefs] = useState<PreferencesDraft>({
    showMe: "anyone",
    womenOnlyVisibility: false,
  });
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const aboutParsed = aboutYouSchema.safeParse(about);

  function updateAbout(next: AboutYouDraft) {
    setAbout(next);
    if (next.gender === "man" && prefs.womenOnlyVisibility) {
      setPrefs({ ...prefs, womenOnlyVisibility: false });
    }
  }

  function getStarted() {
    if (!aboutParsed.success || !adult) return;
    setError(null);
    startTransition(async () => {
      const res = await createProfile({
        ...aboutParsed.data,
        ...prefs,
        confirmed18: true,
      });
      if (!res.ok) setError(res.error);
    });
  }

  if (step === 1) {
    return (
      <main className="pb-safe min-h-dvh pb-10">
        <NavBar
          modal
          title="About You"
          left={<NavButton onClick={() => signOut()}>Sign out</NavButton>}
          right={
            <NavButton
              bold
              disabled={!aboutParsed.success}
              onClick={() => setStep(2)}
            >
              Next
            </NavButton>
          }
        />
        <p className="mx-8 mt-2 mb-5 text-sub text-secondary">
          This is what people nearby will see. Only your first name and last
          initial are shown.
        </p>
        <AboutYouFields
          value={about}
          onChange={updateAbout}
          areas={areas}
          gyms={gyms}
          onRequestArea={requestArea}
        />
        <div className="px-4">
          <Button disabled={!aboutParsed.success} onClick={() => setStep(2)}>
            Next
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-safe min-h-dvh pb-10">
      <NavBar
        modal
        title="Preferences"
        left={
          <NavButton onClick={() => setStep(1)}>
            <ChevronLeft className="-ml-1" />
            About You
          </NavButton>
        }
      />
      <div className="pt-4">
        <PreferencesFields
          value={prefs}
          onChange={setPrefs}
          gender={about.gender}
        />
      </div>

      <ListGroup>
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 px-4 py-3">
          <input
            type="checkbox"
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
            className="mt-0.5 size-[22px] shrink-0 accent-accent"
          />
          <span className="text-sub">
            I&apos;m 18 or older and I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener"
              className="text-accent"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </ListGroup>

      {error ? (
        <p role="alert" className="mx-8 -mt-6 mb-6 text-foot text-destructive">
          {error}
        </p>
      ) : null}

      <div className="px-4">
        <Button
          onClick={getStarted}
          disabled={!adult || !aboutParsed.success}
          loading={pending}
        >
          Get Started
        </Button>
        <p className="mt-3 text-center text-foot text-secondary">
          First sessions happen at the gym, in public.
        </p>
      </div>
    </main>
  );
}
