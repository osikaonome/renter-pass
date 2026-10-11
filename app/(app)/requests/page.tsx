import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RequestInbox } from "./request-inbox";

export const metadata: Metadata = { title: "Requests" };

export default function RequestsPage() {
  return (
    <>
      <PageHeader
        title="Requests"
        description="Landlords who verified their email and asked for documents. You decide, document by document."
      />
      <RequestInbox />
    </>
  );
}
