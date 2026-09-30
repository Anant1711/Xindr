import { LegalPage } from "../LegalPage";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <h2>What we collect</h2>
      <ul>
        <li>
          Your email address (to sign you in). It is never shown to other
          people.
        </li>
        <li>
          Your profile: first name, last initial, gender, level, area, gym,
          usual training time and days, and an optional focus.
        </li>
        <li>Your requests, messages, reports and blocks.</li>
      </ul>
      <h2>What others see</h2>
      <p>
        Your first name and last initial, gender, level, area, gym, training
        times and days, focus, and an approximate distance between areas. Never
        your email or exact location.
      </p>
      <h2>Your controls</h2>
      <ul>
        <li>Choose who you see, and hide your profile from men.</li>
        <li>Pause your profile to disappear from Nearby.</li>
        <li>Block anyone. They are not told.</li>
        <li>Delete your account, which erases your data.</li>
      </ul>
      <h2>What we do not do</h2>
      <p>
        We do not sell your data, show ads, or use GPS. Location is the area you
        pick.
      </p>
      <h2>Where it is stored</h2>
      <p>Data is stored with our hosting providers (Supabase and Vercel).</p>
      <h2>Contact</h2>
      <p>
        Use Send feedback in the Profile tab for privacy questions or requests.
      </p>
    </LegalPage>
  );
}
