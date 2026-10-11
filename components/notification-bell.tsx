"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon, ClockIcon, EyeIcon, InboxIcon, UsersIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { cn } from "@/components/ui";
import { describeNotification, useMarkNotificationsRead, useNotifications } from "@/hooks/use-notifications";
import { formatRelative } from "@/lib/format";
import type { NotificationType } from "@/lib/types";

const TYPE_ICON: Record<NotificationType, typeof BellIcon> = {
  document_request: InboxIcon,
  link_viewed: EyeIcon,
  access_expiring: ClockIcon,
  household_invite: UsersIcon,
  household_joined: UsersIcon,
};

export function NotificationBell({ className }: { className?: string }) {
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [open, setOpen] = useState(false);
  const unread = data?.filter((n) => !n.read_at).length ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className={cn(
          "relative inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink",
          className,
        )}
      >
        <BellIcon />
        {unread > 0 && (
          <span aria-hidden className="tabular absolute right-2 top-2 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-on-primary ring-2 ring-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications">
        {unread > 0 && (
          <div className="flex justify-end border-b border-hairline px-5 py-2">
            <button type="button" className="text-label font-semibold text-primary-ink hover:underline" onClick={() => markRead.mutate(undefined)}>
              Mark all as read
            </button>
          </div>
        )}
        {!data?.length ? (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-muted">Views, requests and invites will show up here.</p>
          </div>
        ) : (
          <ul>
            {data.map((n) => {
              const { text, href } = describeNotification(n);
              const Icon = TYPE_ICON[n.type] ?? BellIcon;
              return (
                <li key={n.id} className="border-b border-row last:border-0">
                  <Link
                    href={href}
                    onClick={() => {
                      if (!n.read_at) markRead.mutate([n.id]);
                      setOpen(false);
                    }}
                    className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-hover"
                  >
                    <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", n.read_at ? "bg-sunken text-muted" : "bg-primary-soft text-primary-ink")}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", !n.read_at && "font-semibold")}>{text}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{formatRelative(n.created_at)}</span>
                    </span>
                    {!n.read_at && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </>
  );
}
