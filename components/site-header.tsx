import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonClass } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-12">
        <Wordmark />
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 text-sm font-medium text-muted md:flex">
          <Link href="/how-it-works" className="rounded px-3 py-2 hover:text-ink">How it works</Link>
          <Link href="/#security" className="rounded px-3 py-2 hover:text-ink">Security</Link>
          <Link href="/#landlords" className="rounded px-3 py-2 hover:text-ink">For landlords</Link>
          <Link href="/help" className="rounded px-3 py-2 hover:text-ink">Help</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle compact className="hidden sm:inline-flex" />
          <Link href="/login" className={buttonClass("ghost", "hidden sm:inline-flex")}>Sign in</Link>
          <Link href="/login" className={buttonClass("primary")}>Get started</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] lg:px-12">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">One link for every rental application, with your documents under your control.</p>
          <ThemeToggle className="mt-5 sm:hidden" />
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link href="/how-it-works" className="text-muted hover:text-ink">How it works</Link>
          <Link href="/privacy" className="text-muted hover:text-ink">Privacy</Link>
          <Link href="/help" className="text-muted hover:text-ink">Help &amp; safety</Link>
          <Link href="/terms" className="text-muted hover:text-ink">Terms</Link>
          <Link href="/login" className="text-muted hover:text-ink">Sign in</Link>
          <Link href="/cookies" className="text-muted hover:text-ink">Cookies</Link>
        </nav>
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-7xl px-4 py-5 text-[12px] text-muted sm:px-6 lg:px-12">
          Hosted in the EU · Built in Dublin · Not affiliated with any letting agent or listing site
        </p>
      </div>
    </footer>
  );
}
