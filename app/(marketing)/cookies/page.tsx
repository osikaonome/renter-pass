import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Cookie notice" };

export default function CookiesPage() {
  return (
    <Prose title="Cookie notice" updated="October 2026">
      <p>RenterPass uses only strictly necessary cookies, so there is no cookie banner. We don&apos;t use analytics or advertising cookies.</p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Keeps renters signed in</td><td>Session, refreshed while you use the app</td></tr>
          <tr><td>rp_requester</td><td>Remembers that a requester verified their email, for one request</td><td>1 hour</td></tr>
        </tbody>
      </table>
    </Prose>
  );
}
