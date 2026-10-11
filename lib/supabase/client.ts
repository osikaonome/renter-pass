"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Browser client, used only for magic-link sign-in and direct-to-storage uploads. */
export function getBrowserClient() {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
