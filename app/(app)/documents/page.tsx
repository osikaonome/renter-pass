import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DocumentVault } from "./document-vault";

export const metadata: Metadata = { title: "Vault" };

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Document vault"
        description="Private by default. A document is only ever shown to someone you approve, for as long as you choose, with their name watermarked on every page."
      />
      <DocumentVault />
    </>
  );
}
