import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handle, HttpError } from "@/lib/http";
import { notify } from "@/lib/notifications/dispatch";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeEqual } from "@/lib/security/tokens";
import { ViewDigestEmail } from "@/emails/templates";

export const maxDuration = 60;

const DAY_MS = 86_400_000;
// Expired grants are kept briefly so renters can see recent history, then purged.
const GRANT_RETENTION_DAYS = 30;
const VERIFICATION_RETENTION_DAYS = 1;

/**
 * Daily housekeeping (Vercel Cron, see vercel.json):
 * 1. "Access about to expire" in-app notifications
 * 2. Opt-in daily view digest emails
 * 3. Purge expired grants and old verification codes
 */
export const GET = handle(async (request: Request) => {
  const auth = request.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${env.cronSecret}`)) throw new HttpError(401, "Unauthorized");

  const admin = createAdminClient();
  const now = Date.now();

  // 1. Expiring within the next 24 hours, not yet notified.
  const { data: expiring } = await admin
    .from("access_grants")
    .select("id, approved_by_profile_id, expires_at, documents(label), access_requests(requester_name)")
    .is("revoked_at", null)
    .is("expiry_notified_at", null)
    .gt("expires_at", new Date(now).toISOString())
    .lt("expires_at", new Date(now + DAY_MS).toISOString());
  for (const g of expiring ?? []) {
    await notify({
      profileId: g.approved_by_profile_id,
      type: "access_expiring",
      payload: {
        grantId: g.id,
        documentLabel: (g.documents as unknown as { label: string } | null)?.label,
        requesterName: (g.access_requests as unknown as { requester_name: string } | null)?.requester_name,
        expiresAt: g.expires_at,
      },
    });
    await admin.from("access_grants").update({ expiry_notified_at: new Date().toISOString() }).eq("id", g.id);
  }

  // 2. View digest for renters who opted in.
  const since = new Date(now - DAY_MS).toISOString();
  const { data: views } = await admin
    .from("link_views")
    .select("link_id, share_links(label, owner_profile_id, profiles!share_links_owner_profile_id_fkey(email, notification_prefs))")
    .gte("viewed_at", since);

  type ViewRow = {
    share_links: {
      label: string;
      owner_profile_id: string;
      profiles: { email: string; notification_prefs: { link_viewed: { email_digest: boolean } } };
    } | null;
  };
  const digests = new Map<string, { email: string; counts: Map<string, number> }>();
  for (const v of (views ?? []) as unknown as ViewRow[]) {
    const link = v.share_links;
    if (!link?.profiles.notification_prefs.link_viewed.email_digest) continue;
    const entry = digests.get(link.owner_profile_id) ?? { email: link.profiles.email, counts: new Map() };
    entry.counts.set(link.label, (entry.counts.get(link.label) ?? 0) + 1);
    digests.set(link.owner_profile_id, entry);
  }
  for (const { email, counts } of digests.values()) {
    await sendEmail({
      to: email,
      subject: "Your RenterPass links today",
      react: ViewDigestEmail({
        rows: [...counts].map(([label, count]) => ({ label, views: count })),
        url: `${env.siteUrl}/dashboard`,
      }),
    }).catch((error) => console.error("Digest failed", error));
  }

  // 3. Retention.
  await admin
    .from("access_grants")
    .delete()
    .lt("expires_at", new Date(now - GRANT_RETENTION_DAYS * DAY_MS).toISOString());
  await admin
    .from("requester_verifications")
    .delete()
    .lt("created_at", new Date(now - VERIFICATION_RETENTION_DAYS * DAY_MS).toISOString());

  return NextResponse.json({ expiring: expiring?.length ?? 0, digests: digests.size });
});
