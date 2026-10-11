import { NextResponse } from "next/server";
import { after } from "next/server";
import { requireApiSession } from "@/lib/dal";
import { env } from "@/lib/env";
import { handle, HttpError, parseJson } from "@/lib/http";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, sha256 } from "@/lib/security/tokens";
import { RequestDecisionEmail } from "@/emails/templates";
import { decisionSchema } from "@/schemas/request";

/**
 * The caller decides on THEIR documents in a request. In a household request,
 * other members' documents are untouched: each member decides for themselves.
 * Grants are created with the caller's own client, so RLS guarantees only a
 * document's owner can grant access to it.
 */
export const POST = handle(async (request: Request, ctx: RouteContext<"/api/requests/[id]/decision">) => {
  const { supabase, profile } = await requireApiSession();
  const { id } = await ctx.params;
  const { approvedDocumentIds, expiresInHours } = await parseJson(request, decisionSchema);

  const { data: mine } = await supabase
    .from("access_request_documents")
    .select("document_id, decision")
    .eq("request_id", id)
    .eq("owner_profile_id", profile.id);
  if (!mine?.length) throw new HttpError(404, "Request not found");

  const pending = mine.filter((d) => d.decision === "pending").map((d) => d.document_id as string);
  if (!pending.length) throw new HttpError(409, "You've already responded to this request");
  if (approvedDocumentIds.some((docId) => !pending.includes(docId))) {
    throw new HttpError(400, "You can only approve your own requested documents");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 3_600_000);

  if (approvedDocumentIds.length) {
    const { error } = await supabase.from("access_grants").insert(
      approvedDocumentIds.map((documentId) => ({
        request_id: id,
        document_id: documentId,
        approved_by_profile_id: profile.id,
        expires_at: expiresAt.toISOString(),
      })),
    );
    if (error) throw new HttpError(400, error.message);
  }

  const declined = pending.filter((docId) => !approvedDocumentIds.includes(docId));
  for (const [decision, ids] of [
    ["approved", approvedDocumentIds],
    ["declined", declined],
  ] as const) {
    if (!ids.length) continue;
    const { error } = await supabase
      .from("access_request_documents")
      .update({ decision, decided_at: now.toISOString() })
      .eq("request_id", id)
      .in("document_id", ids);
    if (error) throw new HttpError(400, error.message);
  }

  // Tell the requester. Each decision email carries a fresh access link, which
  // also invalidates any earlier one for this request.
  after(async () => {
    const admin = createAdminClient();
    const token = generateToken();
    const { data: req } = await admin
      .from("access_requests")
      .update({ access_token_hash: sha256(token) })
      .eq("id", id)
      .select("requester_email")
      .single();
    if (!req) return;
    await sendEmail({
      to: req.requester_email,
      subject: `${profile.first_name} responded to your document request`,
      react: RequestDecisionEmail({
        renterName: profile.first_name,
        approvedCount: approvedDocumentIds.length,
        declinedCount: declined.length,
        expiresAt: expiresAt.toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Dublin" }),
        url: approvedDocumentIds.length ? `${env.siteUrl}/r/${token}` : null,
      }),
    });
  });

  return NextResponse.json({ approved: approvedDocumentIds.length, declined: declined.length });
});
