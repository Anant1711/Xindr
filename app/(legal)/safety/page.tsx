import { LegalPage } from "../LegalPage";

export const metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <LegalPage title="Safety">
      <h2>First sessions happen at the gym, in public.</h2>
      <p>
        Meet where there are other people and staff around. Do not go to a
        private place.
      </p>
      <h2>Tell a friend</h2>
      <p>Let someone know who you are meeting, where, and when.</p>
      <h2>Trust your instincts</h2>
      <p>
        If something feels off, you can leave. You do not owe anyone a session.
      </p>
      <h2>Use Report and Block</h2>
      <p>
        Open their profile or chat and tap the three dots. Blocking is silent:
        they are not told, and they can no longer find or message you.
      </p>
    </LegalPage>
  );
}
