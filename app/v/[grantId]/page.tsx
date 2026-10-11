import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeftIcon, ClockIcon, ExternalIcon, LockIcon } from "@/components/icons";
import { PublicShell } from "@/components/public-shell";
import { Skeleton } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { loadRequesterAccess } from "@/lib/grant-access";

export const metadata: Metadata = {
  title: "Document",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ViewerPage({ params, searchParams }: PageProps<"/v/[grantId]">) {
  return (
    <PublicShell wide>
      <Suspense fallback={<Skeleton className="h-[70vh]" />}>
        <Viewer params={params} searchParams={searchParams} />
      </Suspense>
    </PublicShell>
  );
}

async function Viewer({
  params,
  searchParams,
}: {
  params: Promise<{ grantId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ grantId }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.t === "string" ? query.t : "";
  const access = await loadRequesterAccess(token);
  const grant = access?.grants.find((g) => g.id === grantId);

  if (!access || !grant) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-hairline bg-surface px-6 py-14 text-center shadow-card">
        <span className="flex size-12 items-center justify-center rounded-full bg-sunken text-muted"><LockIcon /></span>
        <h1 className="mt-4 font-display text-title font-semibold">This document is no longer available</h1>
        <p className="mt-2 text-muted">Access has expired or was revoked by the applicant.</p>
      </div>
    );
  }

  // The file endpoint re-checks the token and renders a fresh watermark every time.
  const src = `/api/public/grants/${grant.id}?t=${encodeURIComponent(token)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/r/${encodeURIComponent(token)}`} prefetch={false} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
            <ChevronLeftIcon size={16} /> All shared documents
          </Link>
          <h1 className="mt-2 truncate font-display text-title font-semibold">{grant.documentLabel}</h1>
          <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted">
            From {grant.ownerFirstName} to {access.requesterName} · <ClockIcon size={12} /> until {formatDateTime(grant.expiresAt)}
          </p>
        </div>
        {grant.mimeType === "application/pdf" && (
          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-ink hover:underline">
            Open full screen <ExternalIcon size={14} />
          </a>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-sunken shadow-card">
        {grant.mimeType === "application/pdf" ? (
          <iframe src={src} title={grant.documentLabel} className="h-[78dvh] w-full bg-white" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- dynamically watermarked, never cached
          <img src={src} alt={grant.documentLabel} className="mx-auto w-full max-w-3xl" />
        )}
      </div>
      <p className="flex items-center gap-1.5 text-[12px] text-muted">
        <LockIcon size={12} /> Watermarked for {access.requesterName}. Opening it is recorded for the applicant.
      </p>
    </div>
  );
}
