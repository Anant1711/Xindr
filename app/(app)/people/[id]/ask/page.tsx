import { BackButton, NavBar } from "@/components/ios/NavBar";
import { StateMessage } from "@/components/ios/StateMessage";

// Placeholder: Phase 4 builds Ask to Train (suggested times, note, send_request).
export default async function AskPage(props: PageProps<"/people/[id]/ask">) {
  const { id } = await props.params;
  return (
    <div>
      <NavBar
        title="Ask to Train"
        left={<BackButton href={`/people/${id}`} />}
      />
      <StateMessage
        title="Coming soon"
        body="Sending requests arrives in the next update."
      />
    </div>
  );
}
