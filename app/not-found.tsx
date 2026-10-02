import Link from "next/link";
import { StateMessage } from "@/components/ios/StateMessage";

// Shared by missing pages and hidden or blocked profiles, so the two look identical.
export default function NotFound() {
  return (
    <div className="pt-safe pt-16">
      <StateMessage
        title="Not available"
        body="This page doesn't exist or is no longer available."
        action={
          <Link href="/" className="text-body text-accent">
            Go to Nearby
          </Link>
        }
      />
    </div>
  );
}
