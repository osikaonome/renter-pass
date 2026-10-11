import { BriefcaseIcon, CalendarIcon, EyeIcon, InboxIcon, KeyIcon, LockIcon, ReceiptIcon, ShieldCheckIcon, WalletIcon } from "@/components/icons";

/**
 * Product illustration for the landing page, built from real UI so it stays
 * crisp, themes correctly and costs no image weight. Decorative: hidden from
 * assistive tech, which gets the page copy instead.
 */
export function PassportVisual() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[26rem] select-none">
      {/* Profile card */}
      <div className="relative rounded-xl border border-hairline bg-surface shadow-overlay">
        <div className="flex items-center gap-3 border-b border-hairline p-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft font-display text-lg font-bold text-primary-ink">AB</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px] font-semibold">Aoife Byrne</p>
            <p className="truncate text-[13px] text-muted">Nurse at St James&apos;s · non-smoker</p>
          </div>
          <span className="eyebrow inline-flex items-center gap-1 rounded-full border border-primary-line bg-primary-soft px-2 py-0.5 text-primary-ink">
            <ShieldCheckIcon size={11} strokeWidth={2.25} /> Profile
          </span>
        </div>
        <div className="grid grid-cols-3 border-b border-hairline text-[12px]">
          {[
            { Icon: CalendarIcon, k: "Move-in", v: "1 Dec" },
            { Icon: WalletIcon, k: "Budget", v: "€1.9k" },
            { Icon: BriefcaseIcon, k: "Work", v: "Full-time" },
          ].map(({ Icon, k, v }) => (
            <div key={k} className="border-r border-hairline p-3 last:border-0">
              <p className="eyebrow flex items-center gap-1 text-muted"><Icon size={11} /> {k}</p>
              <p className="tabular mt-1 font-display text-[15px] font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <div className="p-3 pb-16">
          {[
            { Icon: BriefcaseIcon, label: "Employment letter" },
            { Icon: ReceiptIcon, label: "Payslips, Aug–Oct" },
            { Icon: KeyIcon, label: "Landlord reference" },
          ].map(({ Icon, label }) => (
            <div key={label} className="locked-stripes mb-2 flex items-center gap-3 rounded-lg border border-hairline p-2.5 last:mb-0">
              <span className="flex size-8 items-center justify-center rounded-md border border-hairline bg-surface text-muted"><Icon size={15} /></span>
              <span className="flex-1 text-[13px] font-medium">{label}</span>
              <span className="eyebrow inline-flex items-center gap-1 rounded-full border border-hairline bg-sunken px-2 py-0.5 text-muted">
                <LockIcon size={10} /> Locked
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Request notification */}
      <div className="absolute -bottom-24 left-4 right-4 animate-[fade-up_500ms_ease-out_300ms_both] rounded-lg border border-hairline-strong bg-surface p-3.5 shadow-overlay sm:left-auto sm:-right-10 sm:w-[18rem]">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-amber-ink"><InboxIcon size={15} /></span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">Ciarán (verified) requested 2 documents</p>
            <p className="text-[12px] text-muted">via “Rathmines 2-bed, Daft”</p>
            <div className="mt-2.5 flex gap-1.5">
              <span className="rounded bg-primary px-2.5 py-1 text-[12px] font-semibold text-on-primary">Review</span>
              <span className="rounded border border-hairline px-2.5 py-1 text-[12px] font-semibold">Later</span>
            </div>
          </div>
        </div>
      </div>

      {/* View chip */}
      <div className="absolute -top-5 right-3 animate-[fade-up_500ms_ease-out_600ms_both] rounded-full border border-hairline-strong bg-surface px-3 py-1.5 shadow-raised sm:-left-8 sm:right-auto">
        <p className="tabular flex items-center gap-1.5 text-[12px] font-semibold">
          <EyeIcon size={13} className="text-primary-ink" /> Opened 3 times today
        </p>
      </div>
    </div>
  );
}
