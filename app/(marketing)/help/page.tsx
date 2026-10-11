import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <Prose title="Help">
      <h2>What should a landlord ask for?</h2>
      <p>Commonly reasonable: a landlord reference, an employment letter or recent payslips, and photo ID at the point of signing a lease.</p>
      <p>
        Landlords <strong>don&apos;t</strong> need your PPS number, full bank statements, or bank login details to assess an
        application. If an upload contains a PPS number or bank details, we&apos;ll warn you so you can redact them first.
      </p>

      <h2>Spotting a rental scam</h2>
      <ul>
        <li>Asked for documents or a deposit before you&apos;ve seen the property</li>
        <li>The &ldquo;landlord&rdquo; is abroad and can&apos;t show you around</li>
        <li>The rent is far below similar homes nearby</li>
        <li>Pressure to decide or pay immediately</li>
      </ul>
      <p>If in doubt, decline the request. You can revoke a link or any access at any time.</p>

      <h2>Push notifications on iPhone</h2>
      <p>On iPhone and iPad, notifications work only after you add RenterPass to your Home Screen: tap Share, then &ldquo;Add to Home Screen&rdquo;, open it from there, and turn on notifications in Settings.</p>

      <h2>Households</h2>
      <p>Each person keeps their own profile and documents. When a landlord requests documents through a household link, each person approves only their own documents. Nobody can share another member&apos;s documents.</p>

      <h2>Deleting your data</h2>
      <p>Go to Settings to download everything we hold about you, or to delete your account permanently.</p>
    </Prose>
  );
}
