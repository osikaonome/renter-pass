import "server-only";
import webpush from "web-push";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

export type PushPayload = { title: string; body: string; url: string; tag?: string };

export async function sendPush(profileId: string, payload: PushPayload) {
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return;
  if (!configured) {
    webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
    configured = true;
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", profileId);

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // Subscription expired or the user revoked permission.
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Push failed", status);
        }
      }
    }),
  );
}
