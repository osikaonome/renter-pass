import type { Metadata } from "next";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "Terms of use" };

// TODO(legal): have these reviewed before public launch (scope §6).
export default function TermsPage() {
  return (
    <Prose title="Terms of use" updated="October 2026 (draft pending legal review)">
      <p>RenterPass is a free service for people renting homes in Ireland. By using it you agree to these terms.</p>
      <h2>Your content</h2>
      <ul>
        <li>Only upload documents and information that are yours, accurate, and that you have the right to share.</li>
        <li>You decide who sees your documents. We never share them without your approval.</li>
      </ul>
      <h2>Requesting documents</h2>
      <ul>
        <li>Request only documents you genuinely need to assess an application, and only for a real property.</li>
        <li>Use approved documents only to assess that application. Do not copy, forward or keep them longer than needed.</li>
        <li>Under Irish equality law, you must not ask about or decide based on protected characteristics or receipt of housing assistance.</li>
      </ul>
      <h2>Acceptable use</h2>
      <p>Don&apos;t use RenterPass to collect documents under false pretences, spam renters, or attempt to access data that isn&apos;t yours. We may suspend access to protect users.</p>
      <h2>No guarantees</h2>
      <p>RenterPass doesn&apos;t verify the accuracy of profiles or documents, and isn&apos;t a party to any tenancy.</p>
    </Prose>
  );
}
