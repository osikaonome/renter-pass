import type { Metadata } from "next";
import { Suspense } from "react";
import { MobileTabBar, MobileTabBarView, MobileTopBar, MobileTopBarView, Sidebar, SidebarView } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The chrome prerenders into the static shell (each piece falls back to a
// version without the active route); pages read the session inside their own
// <Suspense> boundaries.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Providers>
      <div className="flex min-h-dvh">
        <Suspense fallback={<SidebarView pathname={null} />}>
          <Sidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<MobileTopBarView pathname={null} />}>
            <MobileTopBar />
          </Suspense>
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">
            {children}
          </main>
        </div>
      </div>
      <Suspense fallback={<MobileTabBarView pathname={null} />}>
        <MobileTabBar />
      </Suspense>
    </Providers>
  );
}
