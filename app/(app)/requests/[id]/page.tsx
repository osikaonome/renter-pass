import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertIcon, ChevronLeftIcon, QuoteIcon } from "@/components/icons";
import { Alert, Avatar, Card, DataRow, Skeleton, VerifiedPill } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import { DecisionForm } from "./decision-form";

export const metadata: Metadata = { title: "Document request" };

export default function RequestPage({ params }: PageProps<"/requests/[id]">) {
  return (
    <>
      <Link href="/requests" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeftIcon size={16} /> Requests
      </Link>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <RequestReview params={params} />
      </Suspense>
    </>
  );
}

async function RequestReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireSession();

  // RLS: visible only if the request came through my link or includes my documents.
  const { data: request } = await supabase
    .from("access_requests")
    .select("id, requester_name, requester_email, email_verified_at, requester_message, status, created_at, share_links(label, revoked_at)")
    .eq("id", id)
    .maybeSingle();
  if (!request) notFound();

  const [{ data: mine }, { data: grants }] = await Promise.all([
    supabase
      .from("access_request_documents")
      .select("document_id, decision, documents(label, category)")
      .eq("request_id", id)
      .eq("owner_profile_id", profile.id),
    supabase
      .from("access_grants")
      .select("id, document_id, expires_at, revoked_at, view_count")
      .eq("request_id", id)
      .eq("approved_by_profile_id", profile.id),
  ]);

  const link = request.share_links as unknown as { label: string; revoked_at: string | null } | null;
  const documents = (mine ?? []).map((d) => {
    const doc = d.documents as unknown as { label: string; category: string } | null;
    return {
      id: d.document_id as string,
      label: doc?.label ?? "Deleted document",
      category: doc?.category ?? "other",
      decision: d.decision as "pending" | "approved" | "declined",
    };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 border-b border-hairline p-5">
            <Avatar name={request.requester_name} size={52} />
            <div className="min-w-0">
              <h1 className="truncate text-title font-semibold">{request.requester_name}</h1>
              <div className="mt-1">
                <VerifiedPill>Email verified</VerifiedPill>
              </div>
            </div>
          </div>
          <dl className="px-5 py-1">
            <DataRow label="Email">
              <span className="break-all">{request.requester_email}</span>
            </DataRow>
            <DataRow label="Via link">{link?.label}</DataRow>
            <DataRow label="Requested">{formatDateTime(request.created_at)}</DataRow>
          </dl>
          {request.requester_message && (
            <div className="border-t border-hairline bg-sunken p-5">
              <QuoteIcon size={18} className="text-subtle" />
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6">{request.requester_message}</p>
            </div>
          )}
        </Card>
        <div className="mt-4 flex gap-3 rounded-lg border border-amber-line bg-amber-soft p-4 text-sm">
          <AlertIcon size={18} className="mt-0.5 shrink-0 text-amber-ink" />
          <p>
            A verified email proves they own that inbox, not that they&apos;re a real landlord. Only share with someone you&apos;ve
            been in touch with about a property you&apos;ve seen or will view.
          </p>
        </div>
      </div>

      <div className="lg:col-span-7">
        {link?.revoked_at && (
          <Alert tone="info" className="mb-4">You switched off this link, so access through it has ended.</Alert>
        )}
        {documents.length === 0 ? (
          <Card className="p-5">
            <p className="text-muted">None of your documents are in this request. Each household member decides on their own documents.</p>
          </Card>
        ) : (
          <DecisionForm
            requestId={id}
            requesterName={request.requester_name}
            documents={documents}
            grants={grants ?? []}
            defaultHours={profile.default_access_hours}
            disabled={!!link?.revoked_at}
          />
        )}
      </div>
    </div>
  );
}
