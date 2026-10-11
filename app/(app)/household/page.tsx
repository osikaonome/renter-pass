import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { HouseholdManager } from "./household-manager";

export const metadata: Metadata = { title: "Household" };

export default function HouseholdPage() {
  return (
    <>
      <PageHeader
        title="Household"
        description="Apply together on one link. Everyone keeps their own profile and vault, and approves requests for their own documents only."
      />
      <HouseholdManager />
    </>
  );
}
