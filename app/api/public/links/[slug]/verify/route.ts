import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clientIp, handle, HttpError, parseJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtp, hmac, sha256 } from "@/lib/security/tokens";
import { VerificationCodeEmail } from "@/emails/templates";
import { verifyStartSchema } from "@/schemas/request";

const CODE_TTL_MS = 10 * 60 * 1000;

/** Step 1 of a document request: email a one-time code to the requester. */
export const POST = handle(async (request: Request, ctx: RouteContext<"/api/public/links/[slug]/verify">) => {
  const { slug } = await ctx.params;
  const input = await parseJson(request, verifyStartSchema);
  const email = input.email.toLowerCase();

  await rateLimit("verifyStartPerIp", clientIp(request));
  await rateLimit("verifyStartPerLink", slug);
  await rateLimit("verifyStartPerEmail", sha256(email));

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("share_links")
    .select("id, revoked_at, profiles!share_links_owner_profile_id_fkey(first_name)")
    .eq("slug", slug)
    .maybeSingle();
  if (!link || link.revoked_at) throw new HttpError(404, "This link is no longer active");

  const code = generateOtp();
  const { data: verification, error } = await admin
    .from("requester_verifications")
    .insert({
      link_id: link.id,
      requester_name: input.name,
      requester_email: email,
      code_hash: hmac(code, env.appSecret),
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new HttpError(500, "Could not start verification");

  const renterName = (link.profiles as unknown as { first_name: string } | null)?.first_name || "the renter";
  await sendEmail({
    to: email,
    subject: `Your RenterPass code: ${code}`,
    react: VerificationCodeEmail({ code, renterName }),
  });
  if (process.env.NODE_ENV !== "production" && !env.resendApiKey) {
    console.info(`[email:dev] verification code for ${email}: ${code}`);
  }

  return NextResponse.json({ verificationId: verification.id });
});
