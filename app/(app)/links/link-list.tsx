"use client";

import Link from "next/link";
import { useState } from "react";
import { LinkIcon } from "@/components/icons";
import { Alert, Card, EmptyState, Segmented, Skeleton, buttonClass } from "@/components/ui";
import { useLinks } from "@/hooks/use-links";
import { LinkRow } from "./link-row";

export function LinkList() {
  const { data, isPending, error } = useLinks();
  const [filter, setFilter] = useState<"live" | "off">("live");

  if (isPending) return <Skeleton className="h-64" />;
  if (error) return <Alert tone="danger">{error.message}</Alert>;

  const live = data.filter((l) => !l.revoked_at);
  const off = data.filter((l) => l.revoked_at);
  const shown = filter === "live" ? live : off;

  return (
    <div className="flex flex-col gap-4">
      {off.length > 0 && (
        <Segmented
          label="Filter links"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "live", label: `Live · ${live.length}` },
            { value: "off", label: `Switched off · ${off.length}` },
          ]}
        />
      )}
      <Card>
        {shown.length === 0 ? (
          <EmptyState
            icon={<LinkIcon />}
            title={filter === "live" ? "No live links" : "Nothing switched off"}
            body="Create a link for each listing you apply to. Landlords see your profile; your documents stay locked."
            action={
              <Link href="/links/new" className={buttonClass("primary")}>
                New application
              </Link>
            }
          />
        ) : (
          <ul>
            {shown.map((l) => (
              <LinkRow key={l.id} link={l} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
