import { after } from "next/server";
import { clientIp, handle } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications/dispatch";

const VIEW_NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Beacon sent by the public profile page once per browser session. Link-preview
 * bots don't run JavaScript, so they aren't counted. No personal data about the
 * viewer is stored.
 */
export const POST = handle(async (request: Request, ctx: RouteContext<"/api/public/links/[slug]/view">) => {
  const { slug } = await ctx.params;
  await rateLimit("linkViewPerIp", clientIp(request));

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("share_links")
    .select("id, label, owner_profile_id, revoked_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!link || link.revoked_at) return new Response(null, { status: 204 });

  const { data: lastView } = await admin
    .from("link_views")
    .select("viewed_at")
    .eq("link_id", link.id)
    .order("viewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  await admin.from("link_views").insert({ link_id: link.id });

  // At most one in-app "viewed" notification per link per hour.
  if (!lastView || Date.now() - new Date(lastView.viewed_at).getTime() > VIEW_NOTIFICATION_COOLDOWN_MS) {
    after(() =>
      notify({
        profileId: link.owner_profile_id,
        type: "link_viewed",
        payload: { linkId: link.id, linkLabel: link.label },
        push: { title: "Your link was opened", body: link.label, url: `/links/${link.id}`, tag: `view-${link.id}` },
      }),
    );
  }
  return new Response(null, { status: 204 });
});
