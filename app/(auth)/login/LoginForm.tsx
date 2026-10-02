"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BottomBar } from "@/components/ios/BottomBar";
import { Button, buttonClass } from "@/components/ios/Button";
import { BackButton, NavBar } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, otpSchema } from "@/lib/validation";

type Step = "choose" | "email" | "code";

export const fieldClass =
  "h-14 w-full rounded-[14px] bg-surface px-4 text-[17px] text-label outline-none placeholder:text-secondary focus:ring-2 focus:ring-accent";

export function LoginForm({
  googleEnabled,
  callbackError,
  accountDeleted = false,
}: {
  googleEnabled: boolean;
  callbackError: boolean;
  accountDeleted?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError ? "Sign-in didn't complete. Please try again." : null,
  );

  function go(next: Step) {
    setError(null);
    setStep(next);
  }

  async function continueWithGoogle() {
    if (!googleEnabled) {
      toast.show("Google sign-in isn't available yet. Use email for now.");
      return;
    }
    setBusy(true);
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setBusy(false);
      setError("Couldn't start Google sign-in. Please try again.");
    }
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.signInWithOtp({
      email: parsed.data,
      // If the email carries a link instead of a code, tapping it lands on /auth/callback.
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (err) {
      setError(
        err.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "Couldn't send the code. Please try again.",
      );
      return;
    }
    setEmail(parsed.data);
    setCode("");
    setStep("code");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.verifyOtp({
      email,
      token: parsed.data,
      type: "email",
    });
    if (err) {
      setBusy(false);
      setError("That code didn't work. Check it, or send a new one.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const errorLine = error ? (
    <p role="alert" className="mt-3 text-sub text-destructive">
      {error}
    </p>
  ) : null;

  if (step === "choose") {
    return (
      <main className="pt-safe flex min-h-dvh flex-col bg-accent text-white">
        <div className="flex flex-1 flex-col items-center justify-center gap-9 px-5">
          <svg
            width="220"
            height="220"
            viewBox="0 0 260 260"
            aria-hidden="true"
          >
            <circle
              cx="130"
              cy="130"
              r="128"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle
              cx="130"
              cy="130"
              r="92"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle
              cx="130"
              cy="130"
              r="56"
              stroke="rgba(255,255,255,0.4)"
              fill="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
            />
            <circle cx="130" cy="130" r="20" fill="#FFFFFF" />
          </svg>
          <div className="flex flex-col items-center gap-3.5 text-center">
            <h1 className="font-display text-[38px] leading-[40px] tracking-[-0.3px]">
              FIND YOUR
              <br />
              GYM BUDDY
            </h1>
            <p className="max-w-[300px] text-[16px] leading-6 text-white/90">
              Train with people near you. No streaks, no scrolling. Just showing
              up together.
            </p>
          </div>
        </div>
        <div className="pb-safe flex flex-col gap-3 px-5 pb-10">
          {accountDeleted && !error ? (
            <p
              role="status"
              className="rounded-xl bg-black/20 px-3 py-2 text-center text-sub"
            >
              Your account and data have been deleted.
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-black/20 px-3 py-2 text-center text-sub"
            >
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className={`${buttonClass()} bg-white! text-accent!`}
            onClick={() => go("email")}
          >
            Continue with email
          </button>
          <button
            type="button"
            className={`${buttonClass()} border-[1.5px] border-white/70 bg-transparent! text-white!`}
            onClick={continueWithGoogle}
            disabled={busy}
          >
            <GoogleMark />
            Continue with Google
          </button>
          <p className="mt-1 text-center text-foot text-white/90">
            For adults 18 and over. A platonic app for finding training
            partners.
          </p>
        </div>
      </main>
    );
  }

  if (step === "email") {
    return (
      <main className="min-h-dvh">
        <NavBar left={<BackButton href="/login" label="Back" />} />
        <form onSubmit={sendCode} noValidate className="px-5 pt-2">
          <h1 className="font-display text-[30px] leading-[32px]">
            What&apos;s your email?
          </h1>
          <p className="mt-2 text-[15px] text-secondary">
            We&apos;ll send you a 6-digit code. No password needed.
          </p>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${fieldClass} mt-7`}
          />
          {errorLine}
          <BottomBar>
            <Button type="submit" loading={busy} disabled={!email.trim()}>
              Send code
            </Button>
          </BottomBar>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <NavBar
        left={
          <button
            type="button"
            onClick={() => go("email")}
            className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-secondary"
          >
            Change email
          </button>
        }
      />
      <form onSubmit={verify} noValidate className="px-5 pt-2">
        <h1 className="font-display text-[30px] leading-[32px]">
          Enter your code
        </h1>
        <p className="mt-2 text-[15px] text-secondary">
          We sent it to{" "}
          <span className="font-semibold text-label">{email}</span>. If the
          email has a sign-in link instead, tap it on this device.
        </p>
        <label htmlFor="code" className="sr-only">
          6-digit code
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          placeholder="123456"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className={`${fieldClass} mt-7 text-center text-[24px] font-bold tracking-[0.4em]`}
        />
        {errorLine}
        <button
          type="button"
          onClick={() => sendCode()}
          disabled={busy}
          className="mt-4 min-h-[44px] text-[15px] font-semibold text-accent disabled:opacity-40"
        >
          Send a new code
        </button>
        <BottomBar>
          <Button type="submit" loading={busy} disabled={code.length !== 6}>
            Continue
          </Button>
        </BottomBar>
      </form>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
