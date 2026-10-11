import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Data access layer: the one place that reads the session. Reads cookies, so any
 * Server Component calling these must sit inside a <Suspense> boundary.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single<Profile>();
  if (!profile) return null;

  return { supabase, userId, profile };
});

/** For pages: redirect to sign-in when there is no session. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export class UnauthorizedError extends Error {
  status = 401;
}

/** For route handlers: throw a 401 instead of redirecting. */
export async function requireApiSession() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError("Not signed in");
  return session;
}
