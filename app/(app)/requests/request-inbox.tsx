"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, InboxIcon } from "@/components/icons";
import { Alert, Avatar, Card, EmptyState, Pill, Segmented, Skeleton } from "@/components/ui";
import { useRequests, type RequestSummary } from "@/hooks/use-requests";
import { formatRelative } from "@/lib/format";

function outcome(r: RequestSummary) {
  const approved = r.myDocuments.filter((d) => d.decision === "approved").length;
  if (approved === 0) return <Pill>Declined</Pill>;
  if (approved === r.myDocuments.length) return <Pill tone="verified">Shared</Pill>;
  return <Pill tone="verified">{approved} shared</Pill>;
}

export function RequestInbox() {
  const { data, isPending, error } = useRequests();
  const [tab, setTab] = useState<"pending" | "done">("pending");

  if (isPending) return <Skeleton className="h-64" />;
  if (error) return <Alert tone="danger">{error.message}</Alert>;

  const pending = data.requests.filter((r) => r.awaitingMe);
  const done = data.requests.filter((r) => !r.awaitingMe);
  const shown = tab === "pending" ? pending : done;

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Show"
        value={tab}
        onChange={setTab}
        options={[
          { value: "pending", label: `Waiting for you · ${pending.length}` },
          { value: "done", label: `Decided · ${done.length}` },
        ]}
      />
      <Card>
        {shown.length === 0 ? (
          <EmptyState
            icon={<InboxIcon />}
            title={tab === "pending" ? "You're all caught up" : "No decisions yet"}
            body="Requests appear here when a landlord asks for documents through one of your links."
          />
        ) : (
          <ul>
            {shown.map((r) => {
              const count = r.myDocuments.length;
              return (
                <li key={r.id} className="border-b border-row last:border-0">
                  <Link href={`/requests/${r.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-hover">
                    <Avatar name={r.requesterName} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.requesterName}</p>
                      <p className="truncate text-[13px] text-muted">
                        {count} document{count === 1 ? "" : "s"} · {r.linkLabel} · {formatRelative(r.createdAt)}
                      </p>
                    </div>
                    {r.awaitingMe ? <Pill tone="pending">Review</Pill> : outcome(r)}
                    <ChevronRightIcon size={18} className="shrink-0 text-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
