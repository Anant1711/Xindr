import { APP_NAME } from "@/lib/constants";
import { publicEnv } from "@/lib/env";

const MESSAGE =
  "I'm using Gym Buddy to find training partners nearby. Join me:";

/** Opens the native share sheet, falling back to copying the link. Browser only. */
export async function shareInvite(notify: (message: string) => void) {
  const url = publicEnv.NEXT_PUBLIC_APP_URL;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: APP_NAME, text: MESSAGE, url });
      return;
    } catch (err) {
      // The person closed the share sheet.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${MESSAGE} ${url}`);
    notify("Link copied");
  } catch {
    notify(`Share this link: ${url}`);
  }
}
