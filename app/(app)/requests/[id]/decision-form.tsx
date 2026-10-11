"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionBar } from "@/components/action-bar";
import { DocumentIcon } from "@/components/document-icon";
import { ClockIcon, EyeIcon, LockIcon } from "@/components/icons";
import { Alert, Button, Card, CardHeader, Pill, Segmented, cn } from "@/components/ui";
import { useDecide, useRevokeGrant } from "@/hooks/use-requests";
import { formatDateTime, timeUntil } from "@/lib/format";

type Doc = { id: string; label: string; category: string; decision: "pending" | "approved" | "declined" };
type Grant = { id: string; document_id: string; expires_at: string; revoked_at: string | null; view_count: number };

const EXPIRY_OPTIONS = [
  { value: 24, label: "24 hours" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
];

export function DecisionForm({
  requestId,
  requesterName,
  documents,
  grants,
  defaultHours,
  disabled,
}: {
  requestId: string;
  requesterName: string;
  documents: Doc[];
  grants: Grant[];
  defaultHours: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const decide = useDecide(requestId);
  const revoke = useRevokeGrant();
  const pending = documents.filter((d) => d.decision === "pending");
  const decided = documents.filter((d) => d.decision !== "pending");
  const [selected, setSelected] = useState<Set<string>>(new Set(pending.map((d) => d.id)));
  const options = EXPIRY_OPTIONS.some((o) => o.value === defaultHours)
    ? EXPIRY_OPTIONS
    : [...EXPIRY_OPTIONS, { value: defaultHours, label: `${defaultHours} h` }].sort((a, b) => a.value - b.value);
  const [hours, setHours] = useState(defaultHours);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = (approvedDocumentIds: string[]) =>
    decide.mutate({ approvedDocumentIds, expiresInHours: hours }, { onSuccess: () => router.refresh() });

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && !disabled && (
        <>
          <Card aria-labelledby="choose-heading">
            <CardHeader id="choose-heading" title="Choose what to share" description={`${requesterName} asked for ${pending.length} of your documents.`} />
            <ul>
              {pending.map((d) => {
                const on = selected.has(d.id);
                return (
                  <li key={d.id} className="border-b border-row last:border-0">
                    <label className={cn("flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors", on ? "bg-primary-soft/60" : "hover:bg-hover")}>
                      <DocumentIcon category={d.category} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{d.label}</span>
                        <span className={cn("flex items-center gap-1 text-[13px]", on ? "text-primary-ink" : "text-muted")}>
                          {on ? <EyeIcon size={13} /> : <LockIcon size={13} />}
                          {on ? "Will be shared, watermarked" : "Stays locked"}
                        </span>
                      </span>
                      <span className="relative inline-flex shrink-0">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={on}
                          onChange={() => toggle(d.id)}
                          aria-label={`Share ${d.label}`}
                          className="peer h-6 w-10 cursor-pointer appearance-none rounded-full bg-hairline-strong transition-colors checked:bg-primary"
                        />
                        <span aria-hidden className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-card transition-transform peer-checked:translate-x-4 dark:peer-checked:bg-on-primary" />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-hairline p-5">
              <p className="mb-2 flex items-center gap-1.5 text-label font-semibold">
                <ClockIcon size={15} className="text-muted" /> Access ends after
              </p>
              <Segmented label="Access ends after" value={hours} onChange={setHours} options={options} />
              <p className="mt-2 text-[13px] text-muted">You can revoke access at any time before then.</p>
            </div>
          </Card>
          {decide.error && <Alert tone="danger">{decide.error.message}</Alert>}
          <ActionBar aside={selected.size ? `${requesterName} gets watermarked access for ${options.find((o) => o.value === hours)?.label}.` : "Nothing will be shared."}>
            <Button variant="secondary" size="lg" disabled={decide.isPending} onClick={() => submit([])}>
              Decline
            </Button>
            <Button size="lg" className="flex-1 sm:flex-none" disabled={decide.isPending || selected.size === 0} onClick={() => submit([...selected])}>
              {decide.isPending ? "Saving…" : selected.size === pending.length ? `Share ${selected.size === 1 ? "document" : `all ${selected.size}`}` : `Share ${selected.size} of ${pending.length}`}
            </Button>
          </ActionBar>
        </>
      )}

      {decided.length > 0 && (
        <Card aria-labelledby="decided-heading">
          <CardHeader id="decided-heading" title="Your decisions" />
          <ul>
            {decided.map((d) => {
              const grant = grants.find((g) => g.document_id === d.id);
              const active = grant && !grant.revoked_at && new Date(grant.expires_at) > new Date();
              return (
                <li key={d.id} className="flex items-center gap-3 border-b border-row px-5 py-4 last:border-0">
                  <DocumentIcon category={d.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{d.label}</p>
                    <p className="text-[13px] text-muted">
                      {d.decision === "declined" && "Kept locked"}
                      {grant && active && `Expires in ${timeUntil(grant.expires_at)} · opened ${grant.view_count}×`}
                      {grant?.revoked_at && `Revoked ${formatDateTime(grant.revoked_at)}`}
                      {grant && !grant.revoked_at && !active && "Access expired"}
                    </p>
                  </div>
                  {active ? (
                    <Button variant="quiet-danger" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(grant.id, { onSuccess: () => router.refresh() })}>
                      Revoke
                    </Button>
                  ) : (
                    <Pill>{d.decision === "declined" ? "Declined" : "Ended"}</Pill>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
