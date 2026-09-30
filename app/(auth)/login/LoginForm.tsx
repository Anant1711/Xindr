"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ios/Button";
import { ListGroup } from "@/components/ios/ListGroup";
import { NavBar, NavButton } from "@/components/ios/NavBar";
import { useToast } from "@/components/ios/Toast";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { emailSchema, otpSchema } from "@/lib/validation";

type Step = "choose" | "email" | "code";

const inputClass =
  "h-[50px] w-full bg-transparent px-4 text-[17px] outline-none placeholder:text-[#c4c4c7]";

export function LoginForm({
  googleEnabled,
  callbackError,
}: {
  googleEnabled: boolean;
  callbackError: boolean;
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
      options: { shouldCreateUser: true },
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
    <p role="alert" className="mx-8 -mt-6 mb-6 text-foot text-destructive">
      {error}
    </p>
  ) : null;

  if (step === "choose") {
    return (
      <main className="pt-safe flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col justify-center px-6 text-center">
          <h1 className="text-large-title">{APP_NAME}</h1>
          <p className="mt-2 text-body text-secondary">
            Find someone nearby to train with.
          </p>
        </div>
        <div className="pb-safe flex flex-col gap-3 px-4 pb-8">
          {error ? (
            <p role="alert" className="text-center text-foot text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            variant="secondary"
            className="bg-white! text-label! shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]"
            onClick={continueWithGoogle}
            loading={busy}
          >
            <GoogleMark />
            Continue with Google
          </Button>
          <Button onClick={() => go("email")}>Continue with email</Button>
          <p className="mt-2 text-center text-foot text-secondary">
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
        <NavBar
          modal
          title="Email"
          left={<NavButton onClick={() => go("choose")}>Back</NavButton>}
        />
        <form id="email-form" onSubmit={sendCode} className="pt-6" noValidate>
          <ListGroup footer="We'll email you a 6-digit code. No password needed.">
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
              className={inputClass}
            />
          </ListGroup>
          {errorLine}
          <div className="px-4">
            <Button type="submit" loading={busy} disabled={!email.trim()}>
              Send code
            </Button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <NavBar
        modal
        title="Enter Code"
        left={<NavButton onClick={() => go("email")}>Back</NavButton>}
      />
      <form onSubmit={verify} className="pt-6" noValidate>
        <p className="mx-8 mb-4 text-sub text-secondary">
          We sent a code to <span className="text-label">{email}</span>.
        </p>
        <ListGroup>
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
            className={`${inputClass} text-center text-[22px] tracking-[0.4em]`}
          />
        </ListGroup>
        {errorLine}
        <div className="flex flex-col gap-2 px-4">
          <Button type="submit" loading={busy} disabled={code.length !== 6}>
            Continue
          </Button>
          <Button variant="plain" onClick={() => sendCode()} disabled={busy}>
            Send a new code
          </Button>
        </div>
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
