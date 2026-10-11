import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

const FIX_LINKS: Record<string, string> = {
  employment_letter: "/documents",
  landlord_reference: "/documents",
};

function Ring({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-sunken" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - percent / 100)}
        className="stroke-primary transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

export function CompletenessMeter({ percent, missing }: { percent: number; missing: { key: string; label: string }[] }) {
  const status = percent >= 90 ? "Ready to apply" : percent >= 60 ? "Nearly there" : "Getting started";
  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className="relative"
          role="progressbar"
          aria-label="Application strength"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <Ring percent={percent} />
          <span className="tabular absolute inset-0 flex items-center justify-center font-display text-[15px] font-bold">{percent}%</span>
        </div>
        <div>
          <p className="eyebrow text-muted">Application strength</p>
          <p className="font-display text-subtitle font-semibold">{status}</p>
        </div>
      </div>
      {missing.length > 0 && (
        <ul className="mt-4 border-t border-row">
          {missing.slice(0, 4).map((m) => (
            <li key={m.key} className="border-b border-row last:border-0">
              <Link href={FIX_LINKS[m.key] ?? "/profile"} className="group flex min-h-11 items-center gap-3 text-sm">
                <span aria-hidden className="size-4 shrink-0 rounded-full border-2 border-hairline-strong" />
                <span className="flex-1 text-ink group-hover:text-primary-ink">{m.label}</span>
                <ChevronRightIcon size={16} className="text-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
