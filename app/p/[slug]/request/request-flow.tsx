"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { DocumentIcon } from "@/components/document-icon";
import { CheckIcon, ChevronLeftIcon, MailIcon, ShieldCheckIcon } from "@/components/icons";
import { Alert, Button, Field, cn } from "@/components/ui";
import type { RequestableDocument } from "@/lib/public-link";

type Step = "details" | "code" | "documents" | "done";
const ORDER: Step[] = ["details", "code", "documents"];
const LABELS = ["Your details", "Verify email", "Choose documents"];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as T;
}

export function RequestFlow({
  slug,
  renterNames,
  isHousehold,
  documents,
}: {
  slug: string;
  renterNames: string;
  isHousehold: boolean;
  documents: RequestableDocument[];
}) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptNotice, setAcceptNotice] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const base = `/api/public/links/${slug}`;
  const index = ORDER.indexOf(step);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const sendCode = (e?: FormEvent) => {
    e?.preventDefault();
    return run(async () => {
      const result = await post<{ verificationId: string }>(`${base}/verify`, { name, email, acceptNotice });
      setVerificationId(result.verificationId);
      setCode("");
      setStep("code");
    });
  };

  const confirmCode = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      await post(`${base}/confirm`, { verificationId, code });
      setStep("documents");
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    return run(async () => {
      await post(`${base}/requests`, { documentIds: [...selected], message: message || undefined });
      setStep("done");
    });
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center rounded-xl border border-hairline bg-surface px-6 py-12 text-center shadow-card">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <CheckIcon size={26} strokeWidth={2.5} />
        </span>
        <h1 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-title font-semibold">Request sent</h1>
        <p className="mt-2 max-w-sm text-muted">
          {renterNames} {isHousehold ? "have" : "has"} been notified. If approved, we&apos;ll email <strong className="text-ink">{email}</strong> a private link. Access is time-limited.
        </p>
        <Link href={`/p/${slug}`} className="mt-6 text-sm font-semibold text-primary-ink hover:underline">Back to the application</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/p/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeftIcon size={16} /> {renterNames}&apos;s application
      </Link>

      <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-card">
        <ol className="grid grid-cols-3 border-b border-hairline" aria-label="Progress">
          {LABELS.map((label, i) => (
            <li key={label} aria-current={i === index ? "step" : undefined} className={cn("border-b-2 px-3 py-3 text-center", i <= index ? "border-primary" : "border-transparent")}>
              <span className={cn("eyebrow", i === index ? "text-ink" : "text-muted")}>
                <span className="sm:hidden">Step {i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="p-5 sm:p-8">
          {error && <Alert tone="danger" className="mb-5">{error}</Alert>}

          {step === "details" && (
            <form onSubmit={sendCode} className="flex flex-col gap-5">
              <div>
                <h1 ref={headingRef} tabIndex={-1} className="font-display text-title font-semibold">Request documents from {renterNames}</h1>
                <p className="mt-1.5 text-muted">
                  To protect renters from document fraud, we verify your email first. {renterNames} will see your name and email.
                </p>
              </div>
              <Field label="Your name" hint="Or your agency's name">
                {(props) => <input {...props} required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
              </Field>
              <Field label="Work email">
                {(props) => <input {...props} type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />}
              </Field>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-hairline bg-sunken p-4 text-[13px] leading-5">
                <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" required checked={acceptNotice} onChange={(e) => setAcceptNotice(e.target.checked)} />
                <span>
                  I understand my name and email are shared with the applicant, approved documents are watermarked with my name and expire, and I&apos;ll use them only to assess this application.{" "}
                  <a href="/privacy" target="_blank" className="font-semibold text-primary-ink underline">Privacy notice</a>
                </span>
              </label>
              <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending code…" : "Email me a code"}</Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={confirmCode} className="flex flex-col gap-5">
              <div>
                <h1 ref={headingRef} tabIndex={-1} className="font-display text-title font-semibold">Check your email</h1>
                <p className="mt-1.5 flex items-start gap-2 text-muted">
                  <MailIcon size={18} className="mt-0.5 shrink-0" />
                  <span>We sent a 6-digit code to <strong className="break-all text-ink">{email}</strong>. It expires in 10 minutes.</span>
                </p>
              </div>
              <Field label="Verification code">
                {(props) => (
                  <input
                    {...props}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className={`${props.className} tabular text-center font-mono text-[22px] tracking-[0.5em]`}
                  />
                )}
              </Field>
              <Button type="submit" size="lg" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Verify email"}</Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="font-medium text-muted hover:text-ink" onClick={() => setStep("details")}>Change email</button>
                <button type="button" className="font-semibold text-primary-ink hover:underline" disabled={busy} onClick={() => sendCode()}>Send a new code</button>
              </div>
            </form>
          )}

          {step === "documents" && (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary-line bg-primary-soft px-2.5 py-0.5 text-[12px] font-semibold text-primary-ink">
                  <ShieldCheckIcon size={13} /> {email} verified
                </p>
                <h1 ref={headingRef} tabIndex={-1} className="font-display text-title font-semibold">What do you need?</h1>
                <p className="mt-1.5 text-muted">Ask only for what you need to assess this application.</p>
              </div>
              <fieldset>
                <legend className="sr-only">Documents</legend>
                <ul className="flex flex-col gap-2">
                  {documents.map((d) => {
                    const on = selected.has(d.id);
                    return (
                      <li key={d.id}>
                        <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-focus", on ? "border-primary bg-primary-soft" : "border-hairline hover:border-hairline-strong")}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            onChange={() =>
                              setSelected((s) => {
                                const next = new Set(s);
                                if (next.has(d.id)) next.delete(d.id);
                                else next.add(d.id);
                                return next;
                              })
                            }
                          />
                          <DocumentIcon category={d.category} className="bg-surface" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{d.label}</span>
                            {isHousehold && <span className="block text-[13px] text-muted">{d.ownerFirstName}</span>}
                          </span>
                          <span aria-hidden className={cn("flex size-6 items-center justify-center rounded border-2", on ? "border-primary bg-primary text-on-primary" : "border-hairline-strong")}>
                            {on && <CheckIcon size={14} strokeWidth={3} />}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
              <Field label="Note to the applicant" optional>
                {(props) => <textarea {...props} rows={3} maxLength={500} placeholder="e.g. Thanks for viewing on Tuesday. We'd need these to proceed." value={message} onChange={(e) => setMessage(e.target.value)} />}
              </Field>
              <Button type="submit" size="lg" disabled={busy || selected.size === 0}>
                {busy ? "Sending…" : selected.size ? `Request ${selected.size} document${selected.size === 1 ? "" : "s"}` : "Choose at least one"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
