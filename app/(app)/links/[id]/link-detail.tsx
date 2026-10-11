"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ChevronLeftIcon, ExternalIcon, EyeIcon, InboxIcon, UsersIcon } from "@/components/icons";
import { LinkBox, ShareActions } from "@/components/share-actions";
import { Alert, Avatar, Button, Card, CardHeader, EmptyState, Field, Metric, Pill, Skeleton } from "@/components/ui";
import { publicLinkUrl, useLink, useUpdateLink } from "@/hooks/use-links";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import type { AccessRequestStatus } from "@/lib/types";

const STATUS: Record<AccessRequestStatus, { label: string; tone: "pending" | "verified" | "neutral" | "danger" }> = {
  pending: { label: "Pending", tone: "pending" },
  approved: { label: "Approved", tone: "verified" },
  partially_approved: { label: "Partly approved", tone: "verified" },
  declined: { label: "Declined", tone: "neutral" },
};

export function LinkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isPending, error } = useLink(id);
  const update = useUpdateLink(id);
  const [message, setMessage] = useState<string | null>(null);

  if (isPending) return <Skeleton className="h-96" />;
  if (error) return <Alert tone="danger">{error.message}</Alert>;

  const { link, views, requests } = data;
  const url = publicLinkUrl(link.slug);
  const revoked = !!link.revoked_at;
  const currentMessage = message ?? link.message ?? "";
  const messageDirty = message !== null && message !== (link.message ?? "");
  const lastView = views[0]?.viewed_at;

  return (
    <>
      <Link href="/links" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeftIcon size={16} /> Links
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {revoked ? <Pill>Switched off</Pill> : <Pill tone="verified">Live</Pill>}
            {link.kind === "household" && <Pill icon={<UsersIcon size={12} />}>Household</Pill>}
          </div>
          <h1 className="mt-2 text-headline font-semibold">{link.label}</h1>
          <p className="mt-1 text-sm text-muted">
            Created {formatDate(link.created_at)}
            {link.listing_url && (
              <>
                {" · "}
                <a href={link.listing_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-ink hover:underline">
                  View listing <ExternalIcon size={13} />
                </a>
              </>
            )}
          </p>
        </div>
        {!revoked && (
          <Link href={url} target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-ink hover:underline">
            <EyeIcon size={16} /> See what landlords see
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {!revoked && (
            <Card aria-labelledby="send-heading">
              <CardHeader id="send-heading" title="Send it" description="Paste into Daft, email or WhatsApp. Your documents stay locked." />
              <div className="flex flex-col gap-4 p-5">
                <LinkBox url={url} />
                <Field label="Message">
                  {(props) => (
                    <textarea {...props} rows={8} maxLength={2000} value={currentMessage} onChange={(e) => setMessage(e.target.value)} className={`${props.className} leading-6`} />
                  )}
                </Field>
                {messageDirty && (
                  <Button variant="secondary" className="self-start" disabled={update.isPending} onClick={() => update.mutate({ message: currentMessage })}>
                    {update.isPending ? "Saving…" : "Save message"}
                  </Button>
                )}
                <ShareActions url={url} message={currentMessage} title={link.label} />
              </div>
            </Card>
          )}

          <Card aria-labelledby="requests-heading">
            <CardHeader id="requests-heading" title="Document requests" />
            {requests.length === 0 ? (
              <EmptyState icon={<InboxIcon />} title="No requests yet" body="If the landlord asks for documents, they'll verify their email first and you'll be notified." />
            ) : (
              <ul>
                {requests.map((r) => (
                  <li key={r.id} className="border-b border-row last:border-0">
                    <Link href={`/requests/${r.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-hover">
                      <Avatar name={r.requester_name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.requester_name}</p>
                        <p className="truncate text-[13px] text-muted">{r.requester_email} · {formatRelative(r.created_at)}</p>
                      </div>
                      <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Views" value={views.length} hint={lastView ? `Last ${formatRelative(lastView)}` : "Not opened yet"} />
            <Metric label="Requests" value={requests.length} hint={requests.some((r) => r.status === "pending") ? "Some pending" : undefined} />
          </div>
          <p className="-mt-3 text-[13px] text-muted">We count opens, never who opened it.</p>

          {!revoked && (
            <Card className="p-5">
              <h2 className="text-subtitle font-semibold">Switch off this link</h2>
              <p className="mt-1 text-sm text-muted">
                The profile stops loading for anyone who has it, and every document shared through it is cut off immediately. This can&apos;t be undone.
              </p>
              {update.error && <Alert tone="danger" className="mt-3">{update.error.message}</Alert>}
              <Button
                variant="danger"
                className="mt-4"
                disabled={update.isPending}
                onClick={() => confirm("Switch off this link? This can't be undone.") && update.mutate({ revoked: true })}
              >
                Switch off link
              </Button>
            </Card>
          )}
          {revoked && (
            <Alert tone="info" title="This link is off">
              Switched off {formatDateTime(link.revoked_at)}. Anyone opening it sees a neutral &ldquo;not available&rdquo; page.
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
