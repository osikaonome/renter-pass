import { LockIcon } from "@/components/icons";
import { PublicShell } from "@/components/public-shell";

export default function LinkNotFound() {
  return (
    <PublicShell>
      <div className="flex flex-col items-center rounded-xl border border-hairline bg-surface px-6 py-14 text-center shadow-card">
        <span className="flex size-12 items-center justify-center rounded-full bg-sunken text-muted">
          <LockIcon />
        </span>
        <h1 className="mt-4 font-display text-title font-semibold">This link isn&apos;t available</h1>
        <p className="mt-2 max-w-sm text-muted">The applicant may have switched it off. Contact them directly if you still need their application.</p>
      </div>
    </PublicShell>
  );
}
