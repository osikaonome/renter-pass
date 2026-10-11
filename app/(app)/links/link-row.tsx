"use client";

import Link from "next/link";
import { ChevronRightIcon, EyeIcon, InboxIcon, UsersIcon } from "@/components/icons";
import { Pill, cn } from "@/components/ui";
import type { LinkSummary } from "@/hooks/use-links";
import { formatRelative } from "@/lib/format";

export function LinkRow({ link }: { link: LinkSummary }) {
  const off = !!link.revoked_at;
  return (
    <li className="border-b border-row last:border-0">
      <Link href={`/links/${link.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-hover">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn("truncate font-semibold", off && "text-muted")}>{link.label}</p>
            {link.kind === "household" && <UsersIcon size={15} className="shrink-0 text-subtle" aria-label="Household link" />}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <span className="tabular inline-flex items-center gap-1">
              <EyeIcon size={14} /> {link.view_count} view{link.view_count === 1 ? "" : "s"}
            </span>
            <span>Created {formatRelative(link.created_at)}</span>
          </p>
        </div>
        {off ? (
          <Pill>Off</Pill>
        ) : link.pending_requests > 0 ? (
          <Pill tone="pending" icon={<InboxIcon size={12} />}>
            {link.pending_requests} pending
          </Pill>
        ) : (
          <Pill tone="verified">Live</Pill>
        )}
        <ChevronRightIcon size={18} className="shrink-0 text-subtle" />
      </Link>
    </li>
  );
}
