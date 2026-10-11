import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Notifications, appearance, sign-in and your data." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const { profile } = await requireSession();
  return (
    <SettingsForm
      email={profile.email}
      initialPrefs={profile.notification_prefs}
      initialHours={profile.default_access_hours}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
    />
  );
}
