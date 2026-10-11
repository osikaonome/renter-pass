import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST only, so a link or prefetch can't sign someone out. `scope=global` ends every session. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const scope = request.nextUrl.searchParams.get("scope") === "global" ? "global" : "local";
  await supabase.auth.signOut({ scope });
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), { status: 303 });
}
