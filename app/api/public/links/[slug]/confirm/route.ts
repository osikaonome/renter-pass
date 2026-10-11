import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clientIp, handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { setRequesterSession } from "@/lib/public-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { hmac, safeEqual } from "@/lib/security/tokens";
import { verifyConfirmSchema } from "@/schemas/request";

const MAX_ATTEMPTS = 5;

/** Step 2: check the one-time code and start a short requester session for this link. */
export const POST = handle(async (request: Request, ctx: RouteContext<"/api/public/links/[slug]/confirm">) => {
  const { slug } = await ctx.params;
  await rateLimit("verifyConfirmPerIp", clientIp(request));
  const { verificationId, code } = await parseJson(request, verifyConfirmSchema);

  const admin = createAdminClient();
  const { data: v } = await admin
    .from("requester_verifications")
    .select("id, link_id, requester_name, requester_email, code_hash, attempts, expires_at, verified_at, share_links(slug, revoked_at)")
    .eq("id", verificationId)
    .maybeSingle();

  const link = v?.share_links as unknown as { slug: string; revoked_at: string | null } | null;
  if (!v || !link || link.slug !== slug || link.revoked_at) throw new HttpError(404, "Verification not found");
  if (v.verified_at) throw new HttpError(409, "This code has already been used");
  if (new Date(v.expires_at) < new Date()) throw new HttpError(410, "This code has expired. Request a new one.");
  if (v.attempts >= MAX_ATTEMPTS) throw new HttpError(429, "Too many attempts. Request a new code.");

  if (!safeEqual(hmac(code, env.appSecret), v.code_hash)) {
    await admin.from("requester_verifications").update({ attempts: v.attempts + 1 }).eq("id", v.id);
    throw new HttpError(400, "That code isn't right");
  }

  await admin.from("requester_verifications").update({ verified_at: new Date().toISOString() }).eq("id", v.id);
  await setRequesterSession({
    verificationId: v.id,
    linkId: v.link_id,
    name: v.requester_name,
    email: v.requester_email,
  });
  return NextResponse.json({ ok: true });
});
