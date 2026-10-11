"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";
import { api } from "@/lib/api-client";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Support = "checking" | "supported" | "unsupported" | "ios-needs-install";

const subscribeNoop = () => () => {};

function detectSupport(vapidPublicKey: string | null): Support {
  if ("serviceWorker" in navigator && "PushManager" in window && vapidPublicKey) return "supported";
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !standalone ? "ios-needs-install" : "unsupported";
}

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const support = useSyncExternalStore<Support>(subscribeNoop, () => detectSupport(vapidPublicKey), () => "checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (support !== "supported") return;
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then(setSubscription);
  }, [support]);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked. Allow them in your browser settings.");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
      });
      await api("/api/push", { method: "POST", body: sub.toJSON() });
      setSubscription(sub);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!subscription) return;
    setBusy(true);
    await api("/api/push", { method: "DELETE", body: { endpoint: subscription.endpoint } }).catch(() => {});
    await subscription.unsubscribe();
    setSubscription(null);
    setBusy(false);
  }

  if (support === "checking") return null;
  if (support === "ios-needs-install") {
    return (
      <div className="text-sm">
        <p className="font-semibold">Push on iPhone</p>
        <p className="mt-1 text-muted">
          Add RenterPass to your Home Screen first: tap Share, then &ldquo;Add to Home Screen&rdquo;, open it from there and come back here.
        </p>
      </div>
    );
  }
  if (support === "unsupported") return <p className="text-sm text-muted">Push notifications aren&apos;t available in this browser.</p>;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">This device</p>
        <p className="text-muted">{subscription ? "Push notifications are on." : "Turn on to get push notifications here."}</p>
        {error && <p className="mt-1 text-danger">{error}</p>}
      </div>
      <Button variant={subscription ? "secondary" : "primary"} size="sm" disabled={busy} onClick={subscription ? disable : enable}>
        {subscription ? "Turn off" : "Turn on"}
      </Button>
    </div>
  );
}
