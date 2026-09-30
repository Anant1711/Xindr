import { LegalPage } from "../LegalPage";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <h2>Who can use Gym Buddy</h2>
      <p>
        You must be 18 or older. One account per person, using your real first
        name.
      </p>
      <h2>What it is for</h2>
      <p>
        Gym Buddy helps people find a training partner nearby. It is a platonic
        fitness app, not a dating service.
      </p>
      <h2>How to behave</h2>
      <ul>
        <li>Be respectful. No harassment, threats, hate or sexual content.</li>
        <li>No spam, selling, or recruiting.</li>
        <li>Meet at the gym, in public, for your first sessions.</li>
      </ul>
      <p>
        We may remove accounts that break these rules. Use Report and Block if
        something feels wrong.
      </p>
      <h2>Your safety</h2>
      <p>
        We do not verify identities. You are responsible for your own safety
        when meeting someone. Read the Safety tips before your first session.
      </p>
      <h2>Leaving</h2>
      <p>
        You can delete your account at any time from Profile. This erases your
        data.
      </p>
    </LegalPage>
  );
}
