"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ActionBar } from "@/components/action-bar";
import { CheckIcon, ChevronLeftIcon, EyeIcon, LockIcon, PenIcon, RefreshIcon, UserIcon, UsersIcon } from "@/components/icons";
import { LinkBox, ShareActions } from "@/components/share-actions";
import { Alert, Button, Card, Field, cn } from "@/components/ui";
import { useHouseholds } from "@/hooks/use-households";
import { publicLinkUrl, useCreateLink } from "@/hooks/use-links";
import { api } from "@/lib/api-client";
import type { ShareLink } from "@/lib/types";
import type { DraftTurn } from "@/schemas/ai";
import { useDrafter } from "@/stores/drafter";

const STEPS = ["Listing", "Message", "Send"] as const;
const QUICK_REVISIONS = ["Shorter", "More formal", "Warmer", "Mention I can view this week"];

/** Suggest a link name from the listing so the renter rarely has to type one. */
function suggestLabel(text: string, url: string) {
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 3);
  if (firstLine) return firstLine.slice(0, 60);
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "tabular flex size-7 shrink-0 items-center justify-center rounded-full text-label font-bold",
                done && "bg-primary text-on-primary",
                current && "border-2 border-primary text-primary-ink",
                !done && !current && "border border-hairline-strong text-subtle",
              )}
            >
              {done ? <CheckIcon size={14} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className={cn("text-label font-semibold", current ? "text-ink" : "text-muted", !current && "hidden sm:inline")}>{label}</span>
            {i < STEPS.length - 1 && <span aria-hidden className={cn("h-px flex-1", done ? "bg-primary" : "bg-hairline")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function NewApplication() {
  const { data: households } = useHouseholds();
  const createLink = useCreateLink();
  const { history, message, addDraft, setMessage, reset } = useDrafter();

  const [step, setStep] = useState(0);
  const [listingText, setListingText] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"solo" | "household">("solo");
  const [chosenHouseholdId, setHouseholdId] = useState("");
  const [instruction, setInstruction] = useState("");
  const [created, setCreated] = useState<ShareLink | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const householdId = chosenHouseholdId || households?.households[0]?.id || "";
  const hasHouseholds = !!households?.households.length;
  const effectiveLabel = label || suggestLabel(listingText, listingUrl);

  useEffect(() => reset, [reset]);

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const draft = useMutation({
    mutationFn: (revision?: string) =>
      api<Omit<DraftTurn, "role">>("/api/ai/draft", {
        method: "POST",
        body: {
          listingText,
          householdId: kind === "household" ? householdId : undefined,
          history: revision ? history : [],
          instruction: revision,
        },
      }),
    onSuccess: (result, revision) => {
      if (!revision) reset();
      addDraft(revision, result);
      setInstruction("");
    },
  });

  async function create() {
    const link = await createLink
      .mutateAsync({
        label: effectiveLabel || "Untitled listing",
        listingUrl,
        listingText,
        message,
        kind,
        householdId: kind === "household" ? householdId : undefined,
      })
      .catch(() => null);
    if (link) {
      setCreated(link);
      goTo(2);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper step={step} />

      {step === 0 && (
        <>
          <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-title font-semibold">Which listing is this for?</h2>
          <p className="mb-5 text-muted">Paste the description so your message can mention what matters to this landlord.</p>
          <Card className="flex flex-col gap-5 p-5">
            <Field label="Listing description" hint="Copy it from Daft, MyHome, Rent.ie or a Facebook post.">
              {(props) => (
                <textarea {...props} rows={7} maxLength={8000} value={listingText} onChange={(e) => setListingText(e.target.value)} placeholder="Bright 2-bed apartment in Rathmines, available from 1 December…" />
              )}
            </Field>
            <Field label="Listing link" optional>
              {(props) => <input {...props} type="url" inputMode="url" placeholder="https://www.daft.ie/…" value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} />}
            </Field>
            <Field label="Name this link" hint="Only you see this.">
              {(props) => (
                <input {...props} maxLength={80} value={label} placeholder={suggestLabel(listingText, listingUrl) || "e.g. Rathmines 2-bed, Daft"} onChange={(e) => setLabel(e.target.value)} />
              )}
            </Field>

            <fieldset>
              <legend className="mb-2 text-label font-semibold">Applying as</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { value: "solo" as const, title: "Just me", body: "Your own profile", Icon: UserIcon, disabled: false },
                  { value: "household" as const, title: "My household", body: hasHouseholds ? "Everyone on one link" : "Create a household first", Icon: UsersIcon, disabled: !hasHouseholds },
                ].map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-focus",
                      kind === o.value ? "border-primary bg-primary-soft" : "border-hairline hover:border-hairline-strong",
                      o.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <input type="radio" name="kind" className="sr-only" disabled={o.disabled} checked={kind === o.value} onChange={() => setKind(o.value)} />
                    <o.Icon size={20} className={kind === o.value ? "text-primary-ink" : "text-muted"} />
                    <span>
                      <span className="block text-sm font-semibold">{o.title}</span>
                      <span className="block text-[13px] text-muted">{o.body}</span>
                    </span>
                  </label>
                ))}
              </div>
              {!hasHouseholds && (
                <p className="mt-2 text-[13px] text-muted">
                  Applying with others? <Link href="/household" className="font-semibold text-primary-ink hover:underline">Set up a household</Link>.
                </p>
              )}
            </fieldset>
            {kind === "household" && hasHouseholds && households!.households.length > 1 && (
              <Field label="Household">
                {(props) => (
                  <select {...props} value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
                    {households!.households.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                )}
              </Field>
            )}
          </Card>
          <ActionBar aside="Next, we'll draft a message you can edit.">
            <Button size="lg" className="flex-1 sm:flex-none" onClick={() => goTo(1)}>
              Continue
            </Button>
          </ActionBar>
        </>
      )}

      {step === 1 && (
        <>
          <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-title font-semibold">Your message</h2>
          <p className="mb-5 text-muted">Write your own, or draft one from your profile and this listing. It&apos;s never sent automatically.</p>
          <Card className="flex flex-col gap-4 p-5">
            {!message && !draft.isPending && (
              <button
                type="button"
                onClick={() => draft.mutate(undefined)}
                className="group flex items-center gap-4 rounded-lg border border-dashed border-primary-line bg-primary-soft p-4 text-left transition-colors hover:border-primary"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <PenIcon size={18} />
                </span>
                <span>
                  <span className="block font-semibold">Draft it for me</span>
                  <span className="block text-[13px] text-muted">Uses your profile summary and the listing. Never your documents.</span>
                </span>
              </button>
            )}
            {draft.isPending && (
              <div aria-live="polite" className="flex items-center gap-3 rounded-lg bg-sunken p-4 text-sm text-muted">
                <span className="size-4 animate-spin rounded-full border-2 border-hairline-strong border-t-primary" />
                {draft.variables ? "Revising your message…" : "Writing a message that fits this listing…"}
              </div>
            )}
            {draft.error && <Alert tone="danger">{draft.error.message}</Alert>}

            <Field label="Message">
              {(props) => (
                <textarea {...props} rows={10} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, I'm interested in…" className={`${props.className} leading-6`} />
              )}
            </Field>

            {history.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-hairline pt-4">
                <p className="eyebrow text-muted">Adjust</p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {QUICK_REVISIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={draft.isPending}
                      onClick={() => draft.mutate(r.toLowerCase())}
                      className="min-h-9 shrink-0 rounded-full border border-hairline bg-surface px-3.5 text-label font-semibold text-ink transition-colors hover:border-primary hover:text-primary-ink disabled:opacity-50"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (instruction) draft.mutate(instruction);
                  }}
                >
                  <label htmlFor="revise" className="sr-only">Tell it what to change</label>
                  <input
                    id="revise"
                    maxLength={300}
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Or say what to change…"
                    className="min-h-11 min-w-0 flex-1 rounded border border-hairline-strong bg-surface px-3 text-base text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-[15px]"
                  />
                  <Button type="submit" variant="secondary" disabled={!instruction || draft.isPending}>Revise</Button>
                </form>
                <button type="button" onClick={() => draft.mutate(undefined)} disabled={draft.isPending} className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-muted hover:text-ink">
                  <RefreshIcon size={14} /> Start over with a fresh draft
                </button>
              </div>
            )}
          </Card>
          {createLink.error && <Alert tone="danger" className="mt-4">{createLink.error.message}</Alert>}
          <ActionBar>
            <Button variant="secondary" size="lg" onClick={() => goTo(0)} aria-label="Back">
              <ChevronLeftIcon size={18} />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Button size="lg" className="flex-1 sm:flex-none" disabled={createLink.isPending} onClick={create}>
              {createLink.isPending ? "Creating link…" : "Create link"}
            </Button>
          </ActionBar>
        </>
      )}

      {step === 2 && created && (
        <>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
              <CheckIcon size={20} strokeWidth={2.5} />
            </span>
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-title font-semibold">Ready to send</h2>
              <p className="text-sm text-muted">{created.label}</p>
            </div>
          </div>
          <Card className="flex flex-col gap-4 p-5">
            <LinkBox url={publicLinkUrl(created.slug)} />
            {message && (
              <div className="rounded-lg border border-hairline bg-sunken p-4">
                <p className="whitespace-pre-wrap text-[15px] leading-6">{message}</p>
              </div>
            )}
            <ShareActions url={publicLinkUrl(created.slug)} message={message} title={created.label} />
            <p className="flex items-start gap-2 text-[13px] text-muted">
              <LockIcon size={14} className="mt-0.5 shrink-0" />
              The landlord sees your profile. To see documents they must verify their email and you must approve.
            </p>
          </Card>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href={publicLinkUrl(created.slug)} target="_blank" className="inline-flex items-center gap-1.5 text-primary-ink hover:underline">
              <EyeIcon size={16} /> Preview as landlord
            </Link>
            <Link href={`/links/${created.id}`} className="text-primary-ink hover:underline">Manage this link</Link>
            <Link href="/dashboard" className="text-muted hover:text-ink">Back to overview</Link>
          </div>
        </>
      )}
    </div>
  );
}
