"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark, Wordmark } from "@/components/brand";
import {
  ChevronRightIcon,
  HomeIcon,
  InboxIcon,
  InfoIcon,
  LinkIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
  VaultIcon,
} from "@/components/icons";
import { NotificationBell } from "@/components/notification-bell";
import { Sheet } from "@/components/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, buttonClass, cn } from "@/components/ui";
import { displayName, useMe } from "@/hooks/use-me";
import { useRequests } from "@/hooks/use-requests";

type NavItem = { href: string; label: string; Icon: typeof HomeIcon; badge?: "requests" };

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: HomeIcon },
  { href: "/links", label: "Links", Icon: LinkIcon },
  { href: "/requests", label: "Requests", Icon: InboxIcon, badge: "requests" },
  { href: "/documents", label: "Vault", Icon: VaultIcon },
];

const PROFILE_NAV: NavItem[] = [
  { href: "/profile", label: "Profile", Icon: UserIcon },
  { href: "/household", label: "Household", Icon: UsersIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

const TITLES: [string, string][] = [
  ["/links/new", "New application"],
  ["/dashboard", "Overview"],
  ["/links", "Links"],
  ["/requests", "Requests"],
  ["/documents", "Vault"],
  ["/profile", "Profile"],
  ["/household", "Household"],
  ["/settings", "Settings"],
];

function isActive(pathname: string | null, href: string) {
  return !!pathname && (pathname === href || pathname.startsWith(`${href}/`));
}

function usePendingCount() {
  const { data } = useRequests();
  return data?.requests.filter((r) => r.awaitingMe).length ?? 0;
}

function SignOutForm({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <form
      action="/auth/signout"
      method="post"
      // Clear the offline page cache so the next person on this device can't read it.
      onSubmit={() => navigator.serviceWorker?.controller?.postMessage("clear-cache")}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Desktop sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  return <SidebarView pathname={usePathname()} />;
}

export function SidebarView({ pathname }: { pathname: string | null }) {
  const pending = usePendingCount();
  const { data: me } = useMe();

  const item = ({ href, label, Icon, badge }: NavItem) => {
    const active = isActive(pathname, href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
            active ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-sunken hover:text-ink",
          )}
        >
          <Icon size={18} className={active ? "text-primary-ink" : "text-subtle group-hover:text-ink"} />
          <span className="flex-1">{label}</span>
          {badge === "requests" && pending > 0 && (
            <span className="tabular rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-on-primary">{pending}</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
      <div className="flex h-16 items-center justify-between pl-5 pr-2">
        <Wordmark href="/dashboard" />
        <NotificationBell />
      </div>
      <div className="px-3 pb-2 pt-1">
        <Link href="/links/new" className={buttonClass("primary", "w-full")}>
          <PlusIcon size={18} />
          New application
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-0.5">{MAIN_NAV.map(item)}</ul>
        <p className="eyebrow mb-2 mt-7 px-3 text-subtle">You</p>
        <ul className="flex flex-col gap-0.5">{PROFILE_NAV.map(item)}</ul>
      </nav>
      <div className="border-t border-hairline p-3">
        <ThemeToggle compact className="mb-3 w-full" />
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <Avatar name={displayName(me)} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{me?.first_name || "Your account"}</p>
            <p className="truncate text-[12px] text-muted">{me?.email}</p>
          </div>
          <SignOutForm className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink">
            <LogOutIcon size={18} />
            <span className="sr-only">Sign out</span>
          </SignOutForm>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile top bar + account sheet
// ---------------------------------------------------------------------------

export function MobileTopBar() {
  return <MobileTopBarView pathname={usePathname()} />;
}

export function MobileTopBarView({ pathname }: { pathname: string | null }) {
  const { data: me } = useMe();
  const [accountOpen, setAccountOpen] = useState(false);
  const title = TITLES.find(([href]) => isActive(pathname, href))?.[1];

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur-md lg:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex h-14 items-center gap-2 pl-4 pr-1.5">
        <Link href="/dashboard" aria-label="RenterPass home" className="rounded">
          <BrandMark size={26} />
        </Link>
        <p className="min-w-0 flex-1 truncate font-display text-subtitle font-semibold">{title ?? ""}</p>
        <NotificationBell />
        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          aria-label="Account and settings"
          className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-sunken"
        >
          <Avatar name={displayName(me)} size={30} />
        </button>
      </div>

      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} title="Account">
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar name={displayName(me)} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{displayName(me) || "Your account"}</p>
            <p className="truncate text-sm text-muted">{me?.email}</p>
          </div>
        </div>
        <ul className="border-y border-hairline">
          {[...PROFILE_NAV, { href: "/help", label: "Help & safety tips", Icon: InfoIcon }].map(({ href, label, Icon }) => (
            <li key={href} className="border-b border-row last:border-0">
              <Link href={href} onClick={() => setAccountOpen(false)} className="flex min-h-13 items-center gap-3 px-5 hover:bg-hover">
                <Icon size={20} className="text-muted" />
                <span className="flex-1 font-medium">{label}</span>
                <ChevronRightIcon size={18} className="text-subtle" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4">
          <p className="eyebrow mb-2 text-muted">Appearance</p>
          <ThemeToggle className="w-full" />
        </div>
        <div className="border-t border-hairline px-5 py-3">
          <SignOutForm className="flex min-h-11 w-full items-center gap-3 font-medium text-rose-ink">
            <LogOutIcon size={20} />
            Sign out
          </SignOutForm>
        </div>
      </Sheet>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Mobile tab bar
// ---------------------------------------------------------------------------

export function MobileTabBar() {
  return <MobileTabBarView pathname={usePathname()} />;
}

export function MobileTabBarView({ pathname }: { pathname: string | null }) {
  const pending = usePendingCount();
  const [home, links, requests, vault] = MAIN_NAV;

  const tab = ({ href, label, Icon, badge }: NavItem) => {
    const active = isActive(pathname, href) && pathname !== "/links/new";
    return (
      <li key={href} className="flex-1">
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-primary-ink" : "text-muted")}
        >
          <span className="relative">
            <Icon size={22} strokeWidth={active ? 2 : 1.75} />
            {badge === "requests" && pending > 0 && (
              <span className="tabular absolute -right-2 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-4 text-on-primary ring-2 ring-surface">
                {pending}
              </span>
            )}
          </span>
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="mx-auto flex max-w-lg items-end px-1">
        {tab(home)}
        {tab(links)}
        <li className="flex flex-1 justify-center">
          <Link
            href="/links/new"
            aria-label="New application"
            className="-mt-5 mb-1.5 flex size-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-raised ring-4 ring-canvas transition-transform active:scale-95"
          >
            <PlusIcon size={26} strokeWidth={2.25} />
          </Link>
        </li>
        {tab(requests)}
        {tab(vault)}
      </ul>
    </nav>
  );
}
