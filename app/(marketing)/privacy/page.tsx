import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Privacy policy" };

// TODO(legal): have this reviewed before public launch (scope §6).
export default function PrivacyPage() {
  return (
    <Prose title="Privacy policy" updated="October 2026 (draft pending legal review)">
      <p>
        RenterPass helps people renting in Ireland share a rental application and control who sees their documents.
        This policy explains what we collect, why, and your rights under the GDPR.
      </p>

      <h2>Who we are</h2>
      <p>RenterPass is the data controller. Contact: <a href="mailto:privacy@example.com">privacy@example.com</a>.</p>

      <h2>Renters</h2>
      <ul>
        <li><strong>What:</strong> your email, profile details you enter, your photo, documents you upload, links you create, and notifications.</li>
        <li><strong>Why:</strong> to provide the service you signed up for (contract), and with your consent for optional features such as push notifications and view digests.</li>
        <li><strong>Documents</strong> are stored in a private, EU-hosted bucket. They are shared only when you approve a specific request, only for the time you choose, and always watermarked. Documents are never sent to the AI model.</li>
      </ul>

      <h2>People who request documents (landlords and agents)</h2>
      <ul>
        <li><strong>What:</strong> your name, email address, the documents you asked for, an optional message, and when you viewed approved documents.</li>
        <li><strong>Why:</strong> legitimate interest, to protect renters from fraudulent document requests and to let them decide who sees their documents. Your name is shown on watermarks of documents you view.</li>
        <li>Verification codes are deleted after one day.</li>
      </ul>

      <h2>People who view a profile link</h2>
      <p>We record that a link was opened and when. We do not store IP addresses or any other information about viewers.</p>

      <h2>AI message drafting</h2>
      <p>
        When you ask for a draft, we send the listing text and a summary of your profile (first name, job, move-in
        date, budget and similar fields) to OpenRouter and the underlying model provider. We route only to providers
        that do not retain prompts or use them for training. Your surname, contact details and documents are never sent.
      </p>

      <h2>Processors</h2>
      <table>
        <thead>
          <tr><th>Processor</th><th>Purpose</th><th>Location</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Database, authentication, file storage</td><td>EU</td></tr>
          <tr><td>Vercel</td><td>Hosting (Dublin region)</td><td>EU</td></tr>
          <tr><td>OpenRouter and model provider</td><td>AI message drafting</td><td>See their terms</td></tr>
          <tr><td>Resend</td><td>Email delivery</td><td>See their terms</td></tr>
          <tr><td>Upstash</td><td>Rate limiting (hashed identifiers only)</td><td>EU</td></tr>
          <tr><td>Browser push services</td><td>Push notifications you enable</td><td>Your browser vendor</td></tr>
        </tbody>
      </table>

      <h2>Retention</h2>
      <ul>
        <li>Expired document access is deleted 30 days after expiry.</li>
        <li>Inactive accounts are reminded and then deleted after a period we will confirm before launch.</li>
        <li>When you delete your account, your profile, documents and links are deleted immediately.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export and delete your data at any time from Settings. You can also object to
        processing, or complain to the Data Protection Commission (dataprotection.ie).
      </p>

      <h2>Cookies</h2>
      <p>We only use cookies that are strictly necessary to keep you signed in and to protect forms. See our <a href="/cookies">cookie notice</a>.</p>
    </Prose>
  );
}
