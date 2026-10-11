import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DocumentIcon } from "@/components/document-icon";
import { ChevronRightIcon, ClockIcon, LockIcon } from "@/components/icons";
import { PublicShell } from "@/components/public-shell";
import { Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { loadRequesterAccess } from "@/lib/grant-access";

export const metadata: Metadata = {
  title: "Shared documents",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RequesterAccessPage({ params }: PageProps<"/r/[token]">) {
  return (
    <PublicShell>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <AccessList params={params} />
      </Suspense>
    </PublicShell>
  );
}

async function AccessList({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await loadRequesterAccess(token);

  if (!access || access.grants.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-hairline bg-surface px-6 py-14 text-center shadow-card">
        <span className="flex size-12 items-center justify-center rounded-full bg-sunken text-muted"><LockIcon /></span>
        <h1 className="mt-4 font-display text-title font-semibold">No documents available</h1>
        <p className="mt-2 max-w-sm text-muted">
          Access may have expired or been revoked, or a newer link was emailed to you. Contact the applicant if you still need their documents.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow text-muted">{access.linkLabel}</p>
      <h1 className="mt-2 font-display text-headline font-semibold">Shared with {access.requesterName}</h1>
      <p className="mt-2 text-muted">
        Every page is watermarked with your name and today&apos;s date. Please don&apos;t forward this link or keep copies longer than you need.
      </p>
      <ul className="mt-6 overflow-hidden rounded-lg border border-hairline bg-surface shadow-card">
        {access.grants.map((g) => (
          <li key={g.id} className="border-b border-row last:border-0">
            <Link href={`/v/${g.id}?t=${encodeURIComponent(token)}`} prefetch={false} className="flex items-center gap-3 p-4 transition-colors hover:bg-hover">
              <DocumentIcon category={g.documentCategory} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{g.documentLabel}</span>
                <span className="flex items-center gap-1 text-[13px] text-muted">
                  From {g.ownerFirstName} · <ClockIcon size={12} /> until {formatDateTime(g.expiresAt)}
                </span>
              </span>
              <ChevronRightIcon size={18} className="text-subtle" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
