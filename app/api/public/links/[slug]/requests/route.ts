import { NextResponse, after } from "next/server";
import { env } from "@/lib/env";
import { handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications/dispatch";
import { clearRequesterSession, getRequesterSession, loadPublicLink } from "@/lib/public-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, sha256 } from "@/lib/security/tokens";
import { DocumentRequestEmail } from "@/emails/templates";
import { createRequestSchema } from "@/schemas/request";

/** Step 3: a verified requester asks for specific documents. */
export const POST = handle(async (request: Request, ctx: RouteContext<"/api/public/links/[slug]/requests">) => {
  const { slug } = await ctx.params;
  const link = await loadPublicLink(slug, { withPhotos: false });
  if (!link) throw new HttpError(404, "This link is no longer active");

  const session = await getRequesterSession(link.id);
  if (!session) throw new HttpError(401, "Please verify your email first");
  await rateLimit("requestPerLink", link.id);

  const { documentIds, message } = await parseJson(request, createRequestSchema);
  // Only documents currently shown on this link can be requested.
  const available = new Map(link.documents.map((d) => [d.id, d]));
  if (documentIds.some((id) => !available.has(id))) throw new HttpError(400, "Some documents are no longer available");

  const admin = createAdminClient();

  // A verification can be used for one request only.
  const { data: consumed } = await admin
    .from("requester_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", session.verificationId)
    .is("consumed_at", null)
    .not("verified_at", "is", null)
    .select("verified_at")
    .maybeSingle();
  if (!consumed) throw new HttpError(409, "This verification has already been used. Verify again to make another request.");

  const { data: docs } = await admin.from("documents").select("id, profile_id, label").in("id", documentIds);

  const { data: accessRequest, error } = await admin
    .from("access_requests")
    .insert({
      link_id: link.id,
      requester_name: session.name,
      requester_email: session.email,
      email_verified_at: consumed.verified_at,
      requester_message: message || null,
      // Placeholder until the first decision issues a real access link.
      access_token_hash: sha256(generateToken()),
    })
    .select("id")
    .single();
  if (error) throw new HttpError(500, "Could not create request");

  await admin.from("access_request_documents").insert(
    (docs ?? []).map((d) => ({ request_id: accessRequest.id, document_id: d.id, owner_profile_id: d.profile_id })),
  );
  await clearRequesterSession();

  // Each document owner is notified about their own documents only.
  const byOwner = new Map<string, string[]>();
  for (const d of docs ?? []) byOwner.set(d.profile_id, [...(byOwner.get(d.profile_id) ?? []), d.label]);

  after(() =>
    Promise.all(
      [...byOwner].map(([profileId, labels]) =>
        notify({
          profileId,
          type: "document_request",
          payload: { requestId: accessRequest.id, requesterName: session.name, linkLabel: link.label, documents: labels },
          email: {
            subject: `${session.name} requested your documents`,
            react: DocumentRequestEmail({
              requesterName: session.name,
              requesterEmail: session.email,
              linkLabel: link.label,
              documentLabels: labels,
              url: `${env.siteUrl}/requests/${accessRequest.id}`,
            }),
          },
          push: {
            title: "New document request",
            body: `${session.name} wants to see ${labels.length} document${labels.length === 1 ? "" : "s"}`,
            url: `/requests/${accessRequest.id}`,
            tag: `request-${accessRequest.id}`,
          },
        }),
      ),
    ),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
});
