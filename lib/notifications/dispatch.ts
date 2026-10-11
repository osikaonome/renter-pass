import "server-only";
import type { ReactElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { sendPush, type PushPayload } from "@/lib/notifications/push";
import type { NotificationPrefs, NotificationType } from "@/lib/types";

type Dispatch = {
  profileId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  email?: { subject: string; react: ReactElement };
  push?: PushPayload;
};

/**
 * Fan a notification out to in-app, email and push, honouring the renter's
 * per-channel preferences. In-app notifications are always created.
 * Failures in one channel never block the others.
 */
export async function notify({ profileId, type, payload, email, push }: Dispatch) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, notification_prefs")
    .eq("id", profileId)
    .single<{ email: string; notification_prefs: NotificationPrefs }>();
  if (!profile) return;

  const prefs = profile.notification_prefs;
  const channel =
    type === "document_request"
      ? prefs.document_request
      : type === "household_invite"
        ? prefs.household_invite
        : type === "link_viewed"
          ? { email: false, push: prefs.link_viewed.push }
          : { email: false, push: false };

  const results = await Promise.allSettled([
    admin.from("notifications").insert({ profile_id: profileId, type, payload }),
    email && channel.email ? sendEmail({ to: profile.email, ...email }) : null,
    push && channel.push ? sendPush(profileId, push) : null,
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error("Notification channel failed", result.reason);
  }
}
