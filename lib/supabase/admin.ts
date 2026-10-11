import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS, so callers MUST do their own authorization
 * checks. Only used for public link pages, requester actions, notifications and
 * cron jobs. Never import this from client code.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const DOCUMENTS_BUCKET = "documents";
export const PHOTOS_BUCKET = "photos";
