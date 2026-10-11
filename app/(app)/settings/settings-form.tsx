"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { DownloadIcon, LogOutIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, Button, Card, Field, Segmented, Switch, buttonClass } from "@/components/ui";
import { api } from "@/lib/api-client";
import type { NotificationPrefs } from "@/lib/types";
import { PushToggle } from "./push-toggle";

function Section({ id, title, description, children }: { id: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-b border-hairline py-8 first:pt-0 last:border-0 md:grid-cols-[16rem_1fr] md:gap-10">
      <div>
        <h2 id={id} className="text-subtitle font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const ACCESS_OPTIONS = [
  { value: 24, label: "24 hours" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
];

export function SettingsForm({
  email,
  initialPrefs,
  initialHours,
  vapidPublicKey,
}: {
  email: string;
  initialPrefs: NotificationPrefs;
  initialHours: number;
  vapidPublicKey: string | null;
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [hours, setHours] = useState(ACCESS_OPTIONS.some((o) => o.value === initialHours) ? initialHours : 72);
  const save = useMutation({
    mutationFn: (body: { notification_prefs?: NotificationPrefs; default_access_hours?: number }) => api("/api/settings", { method: "PATCH", body }),
  });

  function setPref<G extends keyof NotificationPrefs>(group: G, key: keyof NotificationPrefs[G], value: boolean) {
    const next = { ...prefs, [group]: { ...prefs[group], [key]: value } };
    setPrefs(next);
    save.mutate({ notification_prefs: next });
  }

  return (
    <div>
      {save.error && <Alert tone="danger" className="mb-6">{save.error.message}</Alert>}

      <Section id="appearance" title="Appearance" description="System follows your device's light or dark setting.">
        <ThemeToggle className="w-full sm:w-auto" />
      </Section>

      <Section id="notifications" title="Notifications" description="In-app notifications are always on.">
        <Card className="divide-y divide-row px-5">
          <div className="py-3">
            <p className="eyebrow pt-1 text-muted">Document requests</p>
            <Switch label="Email" checked={prefs.document_request.email} onChange={(v) => setPref("document_request", "email", v)} />
            <Switch label="Push" checked={prefs.document_request.push} onChange={(v) => setPref("document_request", "push", v)} />
          </div>
          <div className="py-3">
            <p className="eyebrow pt-1 text-muted">Household invites</p>
            <Switch label="Email" checked={prefs.household_invite.email} onChange={(v) => setPref("household_invite", "email", v)} />
            <Switch label="Push" checked={prefs.household_invite.push} onChange={(v) => setPref("household_invite", "push", v)} />
          </div>
          <div className="py-3">
            <p className="eyebrow pt-1 text-muted">Link views</p>
            <Switch label="Daily email digest" description="One email a day, only if your links were opened." checked={prefs.link_viewed.email_digest} onChange={(v) => setPref("link_viewed", "email_digest", v)} />
            <Switch label="Push" description="At most once an hour per link." checked={prefs.link_viewed.push} onChange={(v) => setPref("link_viewed", "push", v)} />
          </div>
          <div className="py-4">
            <PushToggle vapidPublicKey={vapidPublicKey} />
          </div>
        </Card>
      </Section>

      <Section id="access" title="Document access" description="How long approved documents stay viewable. You can change it on each request.">
        <Segmented
          label="Default access period"
          value={hours}
          options={ACCESS_OPTIONS}
          onChange={(v) => {
            setHours(v);
            save.mutate({ default_access_hours: v });
          }}
        />
      </Section>

      <Section
        id="signin"
        title="Sign-in"
        description="You stay signed in on this device until you sign out. Signing in again only needs your email."
      >
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-muted">Signed in as</p>
            <p className="truncate font-semibold">{email}</p>
          </div>
          <form action="/auth/signout?scope=global" method="post" onSubmit={() => navigator.serviceWorker?.controller?.postMessage("clear-cache")}>
            <button type="submit" className={buttonClass("secondary", "w-full sm:w-auto")}>
              <LogOutIcon size={16} /> Sign out everywhere
            </button>
          </form>
        </Card>
        <p className="mt-2 text-[13px] text-muted">Lost a phone? Signing out everywhere ends every session, including this one.</p>
      </Section>

      <Section id="data" title="Your data" description="Everything we hold about you, as JSON plus your original files.">
        <a href="/api/account/export" className={buttonClass("secondary")}>
          <DownloadIcon size={16} /> Download my data
        </a>
      </Section>

      <Section id="delete" title="Delete account">
        <DeleteAccount />
      </Section>
    </div>
  );
}

function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const remove = useMutation({
    mutationFn: () => api("/api/account/delete", { method: "POST", body: { confirm } }),
    // Full reload so no signed-in state survives in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    onSuccess: () => window.location.assign("/"),
  });
  return (
    <Card className="border-rose-line p-5">
      <p className="text-sm">
        Permanently deletes your profile, documents and links, ends all document access, and removes you from any household. This can&apos;t be undone.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          remove.mutate();
        }}
      >
        <div className="flex-1">
          <Field label={<>Type <span className="font-mono">DELETE</span> to confirm</>} error={remove.error?.message}>
            {(props) => <input {...props} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" autoCapitalize="characters" />}
          </Field>
        </div>
        <Button type="submit" variant="danger" disabled={confirm !== "DELETE" || remove.isPending}>
          {remove.isPending ? "Deleting…" : "Delete my account"}
        </Button>
      </form>
    </Card>
  );
}
