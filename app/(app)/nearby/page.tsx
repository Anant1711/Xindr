import { LargeTitle } from "@/components/ios/LargeTitle";
import { StateMessage } from "@/components/ios/StateMessage";

export const metadata = { title: "Nearby" };

// Phase 3 replaces this with nearby_profiles().
export default function NearbyPage() {
  return (
    <div className="pt-safe">
      <LargeTitle>Nearby</LargeTitle>
      <StateMessage
        title="You're all set"
        body="People nearby will show up here."
      />
    </div>
  );
}
