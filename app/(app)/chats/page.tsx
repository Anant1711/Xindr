import { LargeTitle } from "@/components/ios/LargeTitle";
import { StateMessage } from "@/components/ios/StateMessage";

export const metadata = { title: "Chats" };

// Phase 4 adds requests; Phase 5 adds conversations.
export default function ChatsPage() {
  return (
    <div className="pt-safe">
      <LargeTitle>Chats</LargeTitle>
      <StateMessage
        title="No messages yet"
        body="When someone accepts your request, your chat appears here."
      />
    </div>
  );
}
