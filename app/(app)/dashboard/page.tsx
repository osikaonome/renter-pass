import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompletenessMeter } from "@/components/completeness-meter";
import { PlusIcon, ShieldCheckIcon } from "@/components/icons";
import { Card, Skeleton, buttonClass } from "@/components/ui";
import { profileCompleteness } from "@/lib/completeness";
import { requireSession } from "@/lib/dal";
import { greeting } from "@/lib/format";
import { ActiveGrants, DashboardMetrics, PendingRequests } from "./panels";
import { RecentLinks } from "./recent-links";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <Suspense fallback={<Skeleton className="h-16 w-72" />}>
          <Greeting />
        </Suspense>
        <Link href="/links/new" className={buttonClass("primary", "hidden sm:inline-flex")}>
          <PlusIcon size={18} />
          New application
        </Link>
      </div>

      <DashboardMetrics />

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <PendingRequests />
          <RecentLinks />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Card className="p-5">
            <Suspense fallback={<Skeleton className="h-40" />}>
              <ProfileStrength />
            </Suspense>
          </Card>
          <ActiveGrants />
          <Card className="p-5">
            <div className="flex gap-3">
              <ShieldCheckIcon className="mt-0.5 shrink-0 text-primary-ink" />
              <div>
                <p className="font-semibold">Spotting a fake listing</p>
                <p className="mt-1 text-sm text-muted">
                  Be wary of anyone who wants documents or a deposit before a viewing. You can decline any request.
                </p>
                <Link href="/help" className="mt-2 inline-block text-sm font-semibold text-primary-ink hover:underline">
                  Safety tips
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

async function Greeting() {
  const { profile } = await requireSession();
  const today = new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Dublin" });
  return (
    <div>
      <p className="eyebrow text-muted">{today}</p>
      <h1 className="mt-1.5 text-headline font-semibold sm:text-[2rem] sm:leading-10">
        {greeting()}
        {profile.first_name ? `, ${profile.first_name}` : ""}
      </h1>
    </div>
  );
}

async function ProfileStrength() {
  const { supabase, profile } = await requireSession();
  const { data: docs } = await supabase.from("documents").select("category").eq("profile_id", profile.id);
  const completeness = profileCompleteness(profile, (docs ?? []).map((d) => d.category));
  return <CompletenessMeter percent={completeness.percent} missing={completeness.missing} />;
}
