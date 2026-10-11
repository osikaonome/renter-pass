import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Supabase client acting as the signed-in user. Every query is subject to RLS.
 * Use in Server Components (inside <Suspense>), Server Actions and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
