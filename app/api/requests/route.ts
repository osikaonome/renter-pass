import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { handle, HttpError } from "@/lib/http";

/**
 * Requests that involve the caller's documents, with the caller's own pending
 * decisions, plus active grants they've given. Powers the dashboard.
 */
export const GET = handle(async () => {
  const { supabase, profile } = await requireApiSession();

  const [{ data: items, error }, { data: grants }] = await Promise.all([
    supabase
      .from("access_request_documents")
      .select(
        "decision, document_id, documents(label), access_requests(id, requester_name, requester_email, requester_message, status, created_at, share_links(label))",
      )
      .eq("owner_profile_id", profile.id)
      .order("request_id"),
    supabase
      .from("access_grants")
      .select("id, expires_at, revoked_at, view_count, documents(label), access_requests(requester_name, share_links(label))")
      .eq("approved_by_profile_id", profile.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at"),
  ]);
  if (error) throw new HttpError(500, error.message);

  type Item = {
    decision: string;
    document_id: string;
    documents: { label: string } | null;
    access_requests: {
      id: string;
      requester_name: string;
      requester_email: string;
      requester_message: string | null;
      status: string;
      created_at: string;
      share_links: { label: string } | null;
    } | null;
  };

  const byRequest = new Map<
    string,
    { request: NonNullable<Item["access_requests"]>; documents: { id: string; label: string; decision: string }[] }
  >();
  for (const item of (items ?? []) as unknown as Item[]) {
    if (!item.access_requests) continue;
    const entry = byRequest.get(item.access_requests.id) ?? { request: item.access_requests, documents: [] };
    entry.documents.push({ id: item.document_id, label: item.documents?.label ?? "", decision: item.decision });
    byRequest.set(item.access_requests.id, entry);
  }

  const requests = [...byRequest.values()]
    .map(({ request, documents }) => ({
      id: request.id,
      requesterName: request.requester_name,
      requesterEmail: request.requester_email,
      requesterMessage: request.requester_message,
      linkLabel: request.share_links?.label ?? "",
      createdAt: request.created_at,
      status: request.status,
      myDocuments: documents,
      awaitingMe: documents.some((d) => d.decision === "pending"),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ requests, activeGrants: grants ?? [] });
});
