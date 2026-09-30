import Link from "next/link";
import { StateMessage } from "@/components/ios/StateMessage";

// Placeholder until Phase 2 adds auth routing (no session → /login, no profile → /onboarding, else /nearby).
export default function Home() {
  return (
    <StateMessage
      title="Gym Buddy"
      body="Scaffold is running."
      action={
        process.env.NODE_ENV !== "production" ? (
          <Link href="/dev/components" className="text-body text-accent">
            View components
          </Link>
        ) : null
      }
    />
  );
}
