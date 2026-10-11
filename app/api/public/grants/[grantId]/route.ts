import type { NextRequest } from "next/server";
import { clientIp, handle, HttpError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { loadRequesterAccess } from "@/lib/grant-access";
import { DOCUMENTS_BUCKET, createAdminClient } from "@/lib/supabase/admin";
import { renderWatermarked } from "@/lib/watermark";

export const maxDuration = 30;

/**
 * Serves one approved document, freshly watermarked with the requester's name,
 * the link label and today's date. The original file is never served.
 */
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/public/grants/[grantId]">) => {
  const { grantId } = await ctx.params;
  await rateLimit("documentViewPerIp", clientIp(request));

  const token = request.nextUrl.searchParams.get("t") ?? "";
  const access = await loadRequesterAccess(token);
  const grant = access?.grants.find((g) => g.id === grantId);
  if (!access || !grant) throw new HttpError(404, "This document is no longer available");

  const admin = createAdminClient();
  const { data: file } = await admin.storage.from(DOCUMENTS_BUCKET).download(grant.storagePath);
  if (!file) throw new HttpError(404, "This document is no longer available");

  const { body, contentType } = await renderWatermarked(new Uint8Array(await file.arrayBuffer()), grant.mimeType, {
    requesterName: access.requesterName,
    linkLabel: access.linkLabel,
    date: new Date(),
  });

  const { data: current } = await admin.from("access_grants").select("view_count").eq("id", grant.id).single();
  await admin
    .from("access_grants")
    .update({ view_count: (current?.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq("id", grant.id);

  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
});
