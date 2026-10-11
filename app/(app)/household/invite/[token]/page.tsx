import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { AcceptInvite } from "./accept-invite";

export const metadata: Metadata = { title: "Household invite", referrer: "no-referrer" };

export default function InvitePage({ params }: PageProps<"/household/invite/[token]">) {
  return (
    <>
      <PageHeader title="Household invite" />
      <Card className="max-w-xl">
        <p>
          Joining a household lets you apply for homes together with one link. You keep your own profile and documents,
          and you approve requests for your own documents only. You can leave at any time.
        </p>
        <Suspense fallback={<Skeleton className="mt-4 h-11 w-40" />}>
          <AcceptInvite params={params} />
        </Suspense>
      </Card>
    </>
  );
}
