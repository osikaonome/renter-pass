import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/documents", "/household", "/links", "/requests", "/settings"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // A redirect must carry any session cookies refreshed above. Supabase rotates
  // refresh tokens, so dropping them here would quietly sign the user out.
  const redirect = (url: URL) => {
    const res = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) res.cookies.set(cookie);
    return res;
  };

  // Optimistic redirect only; pages and APIs re-check the session themselves.
  if (!userId && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return redirect(url);
  }

  // Already signed in: skip the sign-in screen (the PWA and old bookmarks land here).
  if (userId && pathname === "/login") {
    const url = request.nextUrl.clone();
    const next = url.searchParams.get("next");
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    url.search = "";
    return redirect(url);
  }

  return response;
}

export const config = {
  // Public profile, request and viewer routes don't need the renter session.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|icons/|manifest.webmanifest|p/|v/|r/|api/public/|api/cron/).*)",
  ],
};
