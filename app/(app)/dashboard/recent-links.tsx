"use client";

import Link from "next/link";
import { LinkIcon } from "@/components/icons";
import { Card, CardHeader, EmptyState, Skeleton, buttonClass } from "@/components/ui";
import { LinkRow } from "@/app/(app)/links/link-row";
import { useLinks } from "@/hooks/use-links";

export function RecentLinks() {
  const { data, isPending } = useLinks();
  const active = data?.filter((l) => !l.revoked_at).slice(0, 5) ?? [];

  return (
    <Card aria-labelledby="links-heading">
      <CardHeader
        id="links-heading"
        title="Your links"
        action={
          <Link href="/links" className="text-sm font-semibold text-primary-ink hover:underline">
            View all
          </Link>
        }
      />
      {isPending && <Skeleton className="m-5 h-16" />}
      {data && active.length === 0 && (
        <EmptyState
          icon={<LinkIcon />}
          title="Apply to your first listing"
          body="Paste a listing, get a personal message and a link to send. It takes about a minute."
          action={
            <Link href="/links/new" className={buttonClass("primary")}>
              New application
            </Link>
          }
        />
      )}
      <ul>
        {active.map((l) => (
          <LinkRow key={l.id} link={l} />
        ))}
      </ul>
    </Card>
  );
}
