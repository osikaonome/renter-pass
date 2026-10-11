import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { LinkDetail } from "./link-detail";

export const metadata: Metadata = { title: "Link" };

export default function LinkPage({ params }: PageProps<"/links/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <LinkDetail params={params} />
    </Suspense>
  );
}
