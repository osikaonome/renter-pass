"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon, ShareIcon } from "@/components/icons";
import { Button, cn } from "@/components/ui";

const subscribeNoop = () => () => {};

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  };
  return [copied, copy] as const;
}

/** The public URL in a monospace well with a one-tap copy button. */
export function LinkBox({ url, className }: { url: string; className?: string }) {
  const [copied, copy] = useCopy();
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border border-hairline bg-sunken p-1.5 pl-3", className)}>
      <span className="tabular min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{url.replace(/^https?:\/\//, "")}</span>
      <Button variant="secondary" size="sm" onClick={() => copy(url, "url")} aria-label="Copy link">
        {copied === "url" ? <CheckIcon size={16} className="text-primary-ink" /> : <CopyIcon size={16} />}
        {copied === "url" ? "Copied" : "Copy"}
      </Button>
      <span aria-live="polite" className="sr-only">{copied ? "Link copied" : ""}</span>
    </div>
  );
}

/** Native share sheet on phones; copy message + link everywhere. */
export function ShareActions({ url, message, title }: { url: string; message: string; title: string }) {
  const [copied, copy] = useCopy();
  const text = message ? `${message}\n\n${url}` : url;
  const canShare = useSyncExternalStore(subscribeNoop, () => "share" in navigator, () => false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {canShare && (
        <Button size="lg" className="sm:min-h-11" onClick={() => navigator.share({ title, text }).catch(() => {})}>
          <ShareIcon size={18} />
          Share message + link
        </Button>
      )}
      <Button variant={canShare ? "secondary" : "primary"} size="lg" className="sm:min-h-11" onClick={() => copy(text, "all")}>
        {copied === "all" ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
        {copied === "all" ? "Copied to clipboard" : "Copy message + link"}
      </Button>
      <span aria-live="polite" className="sr-only">{copied ? "Copied to clipboard" : ""}</span>
    </div>
  );
}
