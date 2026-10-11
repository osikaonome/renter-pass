"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true } },
      }),
  );

  useEffect(() => {
    // Registers the service worker for offline viewing and push. Kept out of the
    // public profile page to protect its JS budget.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
