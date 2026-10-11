import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand";
import { LockIcon } from "@/components/icons";

/** Chrome for landlord-facing pages: server-rendered, no app JavaScript. */
export function PublicShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <header className="border-b border-hairline bg-surface" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className={`mx-auto flex h-14 items-center justify-between gap-3 px-4 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
          <Link href="/" className="flex items-center gap-2 rounded text-[13px] font-semibold text-muted hover:text-ink">
            <BrandMark size={22} />
            <span>
              Shared via <span className="text-ink">RenterPass</span>
            </span>
          </Link>
          <span className="eyebrow inline-flex items-center gap-1 text-muted">
            <LockIcon size={12} /> Private link
          </span>
        </div>
      </header>
      <main id="main" className={`mx-auto w-full flex-1 px-4 py-6 sm:py-10 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        {children}
      </main>
      <footer className="border-t border-hairline px-4 py-8 text-center text-[12px] text-muted" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
        <p>
          Documents are shared only with the renter&apos;s approval, for a limited time, watermarked with the viewer&apos;s name.
        </p>
        <p className="mt-2">
          <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/" className="underline">About RenterPass</Link>
        </p>
      </footer>
    </>
  );
}
