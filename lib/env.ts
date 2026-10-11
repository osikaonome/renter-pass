import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

// Read lazily so a missing optional integration (email, push, AI) only fails the
// feature that needs it, not the whole build.
export const env = {
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  /** Secret for HMAC-signing requester sessions and hashing one-time codes. */
  get appSecret() {
    return required("APP_SECRET");
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "RenterPass <hello@example.com>";
  },
  get openRouterApiKey() {
    return required("OPENROUTER_API_KEY");
  },
  get openRouterModel() {
    return required("OPENROUTER_MODEL");
  },
  get vapidPublicKey() {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  },
  get vapidPrivateKey() {
    return process.env.VAPID_PRIVATE_KEY;
  },
  get vapidSubject() {
    return process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";
  },
  get upstashUrl() {
    return process.env.UPSTASH_REDIS_REST_URL;
  },
  get upstashToken() {
    return process.env.UPSTASH_REDIS_REST_TOKEN;
  },
  get cronSecret() {
    return required("CRON_SECRET");
  },
};
