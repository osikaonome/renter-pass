import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/security/tokens";

export type RequesterGrant = {
  id: string;
  documentId: string;
  documentLabel: string;
  documentCategory: string;
  mimeType: string;
  storagePath: string;
  ownerFirstName: string;
  expiresAt: string;
};

export type RequesterAccess = {
  requestId: string;
  requesterName: string;
  linkLabel: string;
  grants: RequesterGrant[];
};

/**
 * Resolve a requester's emailed access token to the grants they can open right
 * now. Expired, revoked and revoked-link grants are excluded. Returns null for
 * an unknown token.
 */
export async function loadRequesterAccess(token: string): Promise<RequesterAccess | null> {
  if (!/^[\w-]{20,100}$/.test(token)) return null;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("access_requests")
    .select("id, requester_name, share_links(label, revoked_at)")
    .eq("access_token_hash", sha256(token))
    .maybeSingle();
  if (!request) return null;
  const link = request.share_links as unknown as { label: string; revoked_at: string | null } | null;
  if (!link || link.revoked_at) return { requestId: request.id, requesterName: request.requester_name, linkLabel: link?.label ?? "", grants: [] };

  const { data: grants } = await admin
    .from("access_grants")
    .select("id, document_id, expires_at, documents(label, mime_type, storage_path, category), profiles!access_grants_approved_by_profile_id_fkey(first_name)")
    .eq("request_id", request.id)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());

  return {
    requestId: request.id,
    requesterName: request.requester_name,
    linkLabel: link.label,
    grants: (grants ?? []).flatMap((g) => {
      const doc = g.documents as unknown as { label: string; mime_type: string; storage_path: string; category: string } | null;
      const owner = g.profiles as unknown as { first_name: string } | null;
      if (!doc) return [];
      return [
        {
          id: g.id,
          documentId: g.document_id,
          documentLabel: doc.label,
          documentCategory: doc.category,
          mimeType: doc.mime_type,
          storagePath: doc.storage_path,
          ownerFirstName: owner?.first_name ?? "",
          expiresAt: g.expires_at,
        },
      ];
    }),
  };
}
