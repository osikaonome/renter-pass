import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <Prose title="How it works">
      <h2>1. Build your profile</h2>
      <p>Sign in with your email, no password. Add your job, move-in date, budget, rental history and references. Upload documents to your private vault.</p>
      <h2>2. Create a link for each listing</h2>
      <p>Paste the listing, name the link (say, &ldquo;Rathmines 2-bed, Daft&rdquo;), and get a personal message drafted from your profile. Edit it, then copy or share it with your link.</p>
      <h2>3. The landlord opens your link</h2>
      <p>They see your profile on any device, with no account. Your documents stay locked.</p>
      <h2>4. You approve document requests</h2>
      <p>To ask for documents, the landlord verifies their email with a one-time code and chooses what they need. You get notified, approve all, some or none, and set how long access lasts. Every page they view is watermarked with their name.</p>
      <h2>5. Revoke at any time</h2>
      <p>Switch off a link or any access instantly from your dashboard.</p>
    </Prose>
  );
}
