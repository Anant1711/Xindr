"use client";

import { useState, useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { BottomBar } from "@/components/ios/BottomBar";
import { Button } from "@/components/ios/Button";
import { ChevronLeft, ShieldIcon } from "@/components/ios/icons";
import { IconButton, NavBar, NavButton } from "@/components/ios/NavBar";
import { AboutYouFields } from "@/components/profile/AboutYouFields";
import { PreferencesFields } from "@/components/profile/PreferencesFields";
import type {
  AboutYouDraft,
  Area,
  Gym,
  PreferencesDraft,
} from "@/components/profile/types";
import { SAFETY_LINE } from "@/lib/constants";
import { aboutYouSchema } from "@/lib/validation";
import { requestArea } from "@/app/actions/profile";
import { createProfile } from "./actions";

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

function StepCount({ step }: { step: 1 | 2 }) {
  return (
    <span
      className="text-sub font-bold text-secondary"
      aria-label={`Step ${step} of 2`}
    >
      {step} / 2
    </span>
  );
}

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

  // Men can never hide from men; the toggle is hidden and treated as off.
  const effectivePrefs: PreferencesDraft = {
    ...prefs,
    womenOnlyVisibility:
      about.gender === "man" ? false : prefs.womenOnlyVisibility,
  };

  function getStarted() {
    if (!aboutParsed.success || !adult) return;
    setError(null);
    startTransition(async () => {
      const res = await createProfile({
        ...aboutParsed.data,
        ...effectivePrefs,
        confirmed18: true,
      });
      if (!res.ok) setError(res.error);
    });
  }

  if (step === 1) {
    return (
      <main className="min-h-dvh">
        <NavBar
          left={<NavButton onClick={() => signOut()}>Sign out</NavButton>}
          right={<StepCount step={1} />}
        />
        <h1 className="px-5 pt-1 pb-6 font-display text-[32px] leading-[34px]">
          About you
        </h1>
        <AboutYouFields
          value={about}
          onChange={setAbout}
          areas={areas}
          gyms={gyms}
          onRequestArea={requestArea}
        />
        <BottomBar>
          <Button disabled={!aboutParsed.success} onClick={() => setStep(2)}>
            Continue
          </Button>
        </BottomBar>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <NavBar
        left={
          <IconButton label="Back to About you" onClick={() => setStep(1)}>
            <ChevronLeft size={18} strokeWidth={2.2} />
          </IconButton>
        }
        right={<StepCount step={2} />}
      />
      <h1 className="px-5 pt-1 pb-7 font-display text-[30px] leading-[32px]">
        Who would
        <br />
        you like to meet?
      </h1>

      <PreferencesFields
        value={effectivePrefs}
        onChange={setPrefs}
        gender={about.gender}
      />

      <label className="mx-5 flex cursor-pointer items-start gap-3 rounded-[14px] py-2">
        <input
          type="checkbox"
          checked={adult}
          onChange={(e) => setAdult(e.target.checked)}
          className="mt-0.5 size-[22px] shrink-0 accent-accent"
        />
        <span className="text-[14px] leading-5">
          I&apos;m 18 or older and I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener"
            className="font-semibold text-accent"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="font-semibold text-accent"
          >
            Privacy Policy
          </a>
          .
        </span>
      </label>

      <p className="mx-5 mt-4 flex items-start gap-2.5 text-sub text-secondary">
        <ShieldIcon className="mt-px shrink-0" />
        {SAFETY_LINE}
      </p>

      {error ? (
        <p role="alert" className="mx-5 mt-4 text-sub text-destructive">
          {error}
        </p>
      ) : null}

      <BottomBar>
        <Button
          onClick={getStarted}
          disabled={!adult || !aboutParsed.success}
          loading={pending}
        >
          Get Started
        </Button>
      </BottomBar>
    </main>
  );
}
