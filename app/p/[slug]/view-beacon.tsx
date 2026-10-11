"use client";

import { useEffect } from "react";

/** Counts one view per browser tab session. Bots that only fetch HTML for previews never run this. */
export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `rp-viewed-${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable (private mode): still count the view.
    }
    navigator.sendBeacon?.(`/api/public/links/${slug}/view`);
  }, [slug]);
  return null;
}
