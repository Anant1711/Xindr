import { BackButton, NavBar } from "@/components/ios/NavBar";
import { StateMessage } from "@/components/ios/StateMessage";

// Placeholder: Phase 5 builds the chat thread.
export default function ThreadPage() {
  return (
    <div>
      <NavBar title="Chat" left={<BackButton fallbackHref="/chats" />} />
      <StateMessage
        title="Coming soon"
        body="Chat arrives in a later update."
      />
    </div>
  );
}
