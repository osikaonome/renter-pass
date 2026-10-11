"use client";

import Link from "next/link";
import { ChevronRightIcon, ClockIcon, EyeIcon, InboxIcon, LinkIcon, UnlockIcon } from "@/components/icons";
import { Avatar, Button, Card, CardHeader, EmptyState, Metric, Pill, Skeleton } from "@/components/ui";
import { useLinks } from "@/hooks/use-links";
import { useRequests, useRevokeGrant } from "@/hooks/use-requests";
import { formatRelative, timeUntil } from "@/lib/format";

export function DashboardMetrics() {
  const { data: links } = useLinks();
  const { data: requests } = useRequests();
  const active = links?.filter((l) => !l.revoked_at) ?? [];
  const views = active.reduce((sum, l) => sum + l.view_count, 0);
  const pending = requests?.requests.filter((r) => r.awaitingMe).length;
  const shared = requests?.activeGrants.length;
  const dash = <span className="text-subtle">–</span>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Metric label="Active links" value={links ? active.length : dash} icon={<LinkIcon size={16} />} />
      <Metric label="Profile views" value={links ? views : dash} icon={<EyeIcon size={16} />} />
      <Metric label="Awaiting you" value={requests ? pending : dash} icon={<InboxIcon size={16} />} hint={pending ? "Document requests" : undefined} />
      <Metric label="Shared now" value={requests ? shared : dash} icon={<UnlockIcon size={16} />} hint={shared ? "Time-limited access" : undefined} />
    </div>
  );
}

export function PendingRequests() {
  const { data, isPending, error } = useRequests();
  const pending = data?.requests.filter((r) => r.awaitingMe) ?? [];

  return (
    <Card aria-labelledby="pending-heading">
      <CardHeader
        id="pending-heading"
        title="Needs your decision"
        description="Nothing is shared until you approve it."
        action={
          <Link href="/requests" className="text-sm font-semibold text-primary-ink hover:underline">
            All requests
          </Link>
        }
      />
      {isPending && <Skeleton className="m-5 h-16" />}
      {error && <p className="p-5 text-sm text-danger">{error.message}</p>}
      {data && pending.length === 0 && (
        <EmptyState
          icon={<InboxIcon />}
          title="No requests waiting"
          body="When a landlord asks for documents through one of your links, you'll decide here."
        />
      )}
      <ul>
        {pending.map((r) => {
          const count = r.myDocuments.filter((d) => d.decision === "pending").length;
          return (
            <li key={r.id} className="border-b border-row last:border-0">
              <Link href={`/requests/${r.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-hover">
                <Avatar name={r.requesterName} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.requesterName}</p>
                  <p className="truncate text-sm text-muted">
                    {count} document{count === 1 ? "" : "s"} · {r.linkLabel}
                  </p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <Pill tone="pending">Review</Pill>
                  <span className="text-[12px] text-muted">{formatRelative(r.createdAt)}</span>
                </div>
                <ChevronRightIcon size={18} className="text-subtle" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function ActiveGrants() {
  const { data, isPending } = useRequests();
  const revoke = useRevokeGrant();

  return (
    <Card aria-labelledby="grants-heading">
      <CardHeader id="grants-heading" title="Shared right now" />
      {isPending && <Skeleton className="m-5 h-16" />}
      {data && data.activeGrants.length === 0 && (
        <p className="px-5 py-6 text-sm text-muted">Nobody can see your documents right now.</p>
      )}
      <ul>
        {data?.activeGrants.map((g) => (
          <li key={g.id} className="flex items-center gap-3 border-b border-row px-5 py-3.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{g.documents?.label}</p>
              <p className="flex items-center gap-1 truncate text-[13px] text-muted">
                {g.access_requests?.requester_name} · <ClockIcon size={13} /> {timeUntil(g.expires_at)}
                {g.view_count > 0 && ` · viewed ${g.view_count}×`}
              </p>
            </div>
            <Button variant="quiet-danger" size="sm" onClick={() => revoke.mutate(g.id)} disabled={revoke.isPending}>
              Revoke
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
