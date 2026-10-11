import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicShell } from "@/components/public-shell";
import { Skeleton } from "@/components/ui";
import { getPublicLink } from "../data";
import { RequestFlow } from "./request-flow";

export const metadata: Metadata = {
  title: "Request documents",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RequestPage({ params }: PageProps<"/p/[slug]/request">) {
  return (
    <PublicShell>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Request params={params} />
      </Suspense>
    </PublicShell>
  );
}

async function Request({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getPublicLink(slug);
  if (!link) notFound();
  const names = link.members.map((m) => m.firstName).join(" & ");
  return (
    <RequestFlow
      slug={slug}
      renterNames={names}
      isHousehold={!!link.household}
      documents={link.documents}
    />
  );
}
