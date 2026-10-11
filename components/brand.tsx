import Link from "next/link";
import { cn } from "@/components/ui";

/** The mark: a passport-shaped tile with a keyed doorway. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path d="M9 14.2 16 8.5l7 5.7V23a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1Z" fill="none" className="stroke-on-primary" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="17.2" r="1.7" className="fill-on-primary" />
      <path d="M16 18.6V21" className="stroke-on-primary" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded font-display text-[17px] font-bold tracking-[-0.02em] text-ink", className)}>
      <BrandMark />
      <span>
        Renter<span className="text-primary-ink">Pass</span>
      </span>
    </Link>
  );
}
