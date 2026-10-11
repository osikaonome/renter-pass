"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ZodType } from "zod";
import { ActionBar } from "@/components/action-bar";
import { CheckIcon, ChevronLeftIcon, EyeIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Alert, Avatar, Button, Card, Field, Segmented, buttonClass, cn } from "@/components/ui";
import { api } from "@/lib/api-client";
import { formatBudget, formatDate, formatMonth } from "@/lib/format";
import { SENSITIVE_FLAG_COPY, detectSensitive, type SensitiveFlag } from "@/lib/security/sensitive";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  EMPLOYMENT_TYPE_LABELS,
  basicsStepSchema,
  employmentTypes,
  historyStepSchema,
  householdStepSchema,
  jobStepSchema,
  referencesStepSchema,
} from "@/schemas/profile";
import { STEPS, useProfileDraft, type ProfileDraft, type Step } from "@/stores/profile-draft";

const STEP_META: Record<Step, { label: string; title: string; intro: string }> = {
  basics: { label: "About you", title: "Introduce yourself", intro: "The first thing a landlord reads. Warm and specific beats long." },
  job: { label: "Work", title: "Your work", intro: "Landlords mostly want to know your income is steady." },
  household: { label: "Your move", title: "Your move", intro: "When, how much, and who's moving in." },
  history: { label: "Rental history", title: "Where you've lived", intro: "An area is fine. New to Ireland? Add where you lived before." },
  references: { label: "References", title: "References", intro: "Landlords see names and relationships only. Contact details stay private." },
  photo: { label: "Photo", title: "Add a photo", intro: "Optional, but a friendly photo makes your application feel real." },
};

const STEP_FIELDS: Record<Exclude<Step, "photo">, { schema: ZodType; keys: (keyof ProfileDraft)[] }> = {
  basics: { schema: basicsStepSchema, keys: ["first_name", "last_name", "headline", "intro"] },
  job: { schema: jobStepSchema, keys: ["occupation", "employer", "employment_type"] },
  household: { schema: householdStepSchema, keys: ["move_in_date", "budget_min", "budget_max", "household_size", "pets", "smoker"] },
  history: { schema: historyStepSchema, keys: ["rental_history"] },
  references: { schema: referencesStepSchema, keys: ["references"] },
};

type Errors = Record<string, string>;

function pick(draft: ProfileDraft, keys: (keyof ProfileDraft)[]) {
  return Object.fromEntries(keys.map((k) => [k, draft[k]]));
}

export function ProfileBuilder({ initial, initialPhotoUrl }: { initial: ProfileDraft; initialPhotoUrl: string | null }) {
  const { step, draft, dirty, saveStatus, saveError, warnings, hydrate, setStep, setSaveStatus, setWarnings, markClean } = useProfileDraft();
  const [errors, setErrors] = useState<Errors>({});
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => hydrate(initial), [hydrate, initial]);

  /** Validate and save the given step. Returns false if validation fails. */
  const save = useCallback(
    async (target: Step, { showErrors }: { showErrors: boolean }) => {
      const current = useProfileDraft.getState().draft;
      if (target === "photo" || !current) return true;
      const { schema, keys } = STEP_FIELDS[target];
      const parsed = schema.safeParse(pick(current, keys));
      if (!parsed.success) {
        if (showErrors) setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
        return false;
      }
      setErrors({});
      setSaveStatus("saving");
      try {
        const result = await api<{ warnings: SensitiveFlag[] }>("/api/profile", { method: "PATCH", body: parsed.data });
        setWarnings(result.warnings.map((w) => SENSITIVE_FLAG_COPY[w]));
        markClean();
        setSaveStatus("saved");
        return true;
      } catch (e) {
        setSaveStatus("error", (e as Error).message);
        return false;
      }
    },
    [markClean, setSaveStatus, setWarnings],
  );

  // Autosave shortly after the renter stops typing.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => save(step, { showErrors: false }), 1200);
    return () => clearTimeout(timer);
  }, [draft, dirty, step, save]);

  const go = async (target: Step) => {
    if (dirty && !(await save(step, { showErrors: true }))) return;
    setStep(target);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (!draft) return null;
  const index = STEPS.indexOf(step);
  const meta = STEP_META[step];

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_20rem]">
      {/* Step navigation: progress bar on phones, vertical list from lg */}
      <nav aria-label="Profile sections" className="lg:sticky lg:top-10 lg:self-start">
        <div className="lg:hidden">
          <div className="flex items-center justify-between text-label font-semibold">
            <span>{meta.label}</span>
            <span className="tabular text-muted">{index + 1} of {STEPS.length}</span>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-primary" : "bg-hairline")} />
            ))}
          </div>
        </div>
        <ol className="hidden flex-col gap-0.5 lg:flex">
          {STEPS.map((s, i) => {
            const done = i < index;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => go(s)}
                  aria-current={s === step ? "step" : undefined}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm font-medium transition-colors",
                    s === step ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-sunken hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "tabular flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      done ? "bg-primary text-on-primary" : s === step ? "border-2 border-primary" : "border border-hairline-strong",
                    )}
                  >
                    {done ? <CheckIcon size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  {STEP_META[s].label}
                </button>
              </li>
            );
          })}
        </ol>
        <p aria-live="polite" className="mt-4 hidden h-5 px-2.5 text-[13px] text-muted lg:block">
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "All changes saved" : saveStatus === "error" ? "Couldn't save" : ""}
        </p>
      </nav>

      <div className="min-w-0">
        <div className="mb-5">
          <h2 ref={headingRef} tabIndex={-1} className="text-title font-semibold sm:text-headline">{meta.title}</h2>
          <p className="mt-1 text-muted">{meta.intro}</p>
        </div>

        {saveError && <Alert tone="danger" className="mb-4">{saveError}</Alert>}
        {warnings.map((w) => (
          <Alert key={w} tone="warning" className="mb-4">{w}</Alert>
        ))}

        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          {step === "basics" && <BasicsStep errors={errors} />}
          {step === "job" && <JobStep errors={errors} />}
          {step === "household" && <HouseholdStep errors={errors} />}
          {step === "history" && <HistoryStep errors={errors} />}
          {step === "references" && <ReferencesStep errors={errors} />}
          {step === "photo" && <PhotoStep photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} />}
        </Card>

        <ActionBar aside={<span aria-hidden>{saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "All changes saved" : "Changes save automatically"}</span>}>
          {index > 0 && (
            <Button variant="secondary" size="lg" onClick={() => go(STEPS[index - 1])} aria-label="Previous section">
              <ChevronLeftIcon size={18} />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {index < STEPS.length - 1 ? (
            <Button size="lg" className="flex-1 sm:flex-none" onClick={() => go(STEPS[index + 1])}>
              Continue
            </Button>
          ) : (
            <Link href="/dashboard" className={buttonClass("primary", "flex-1 sm:flex-none", "lg")}>
              Finish
            </Link>
          )}
        </ActionBar>
      </div>

      <aside aria-label="Live preview" className="hidden xl:block">
        <div className="sticky top-10">
          <p className="eyebrow mb-3 flex items-center gap-1.5 text-muted">
            <EyeIcon size={13} /> What landlords see
          </p>
          <Preview draft={draft} photoUrl={photoUrl} />
          <p className="mt-3 text-[12px] text-muted">Contact details and documents are never shown here.</p>
        </div>
      </aside>
    </div>
  );
}

function Preview({ draft, photoUrl }: { draft: ProfileDraft; photoUrl: string | null }) {
  const name = `${draft.first_name} ${draft.last_name}`.trim() || "Your name";
  const job = [draft.occupation, draft.employer && `at ${draft.employer}`].filter(Boolean).join(" ");
  const chips = [
    draft.move_in_date && `From ${formatDate(draft.move_in_date)}`,
    (draft.budget_min || draft.budget_max) && formatBudget(draft.budget_min, draft.budget_max).replace(" / month", "/mo"),
    draft.household_size && `${draft.household_size} ${draft.household_size === 1 ? "person" : "people"}`,
  ].filter(Boolean) as string[];
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={photoUrl} size={48} />
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{name}</p>
            <p className="line-clamp-2 text-[13px] text-muted">{draft.headline || "Your headline"}</p>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="tabular rounded border border-hairline bg-sunken px-2 py-0.5 text-[12px] font-medium">{c}</span>
            ))}
          </div>
        )}
        {draft.intro && <p className="mt-3 line-clamp-4 text-[13px] leading-5">{draft.intro}</p>}
      </div>
      {(job || draft.rental_history.length > 0) && (
        <dl className="border-t border-hairline px-4 py-2 text-[13px]">
          {job && (
            <div className="flex gap-3 py-1">
              <dt className="eyebrow w-16 shrink-0 pt-0.5 text-muted">Work</dt>
              <dd className="min-w-0">{job}</dd>
            </div>
          )}
          {draft.rental_history.slice(0, 2).map((h, i) => (
            <div key={i} className="flex gap-3 py-1">
              <dt className="eyebrow w-16 shrink-0 pt-0.5 text-muted">{i === 0 ? "Lived" : ""}</dt>
              <dd className="min-w-0 truncate">{h.address || "—"} <span className="text-muted">{h.from ? `${formatMonth(h.from)}–${formatMonth(h.to || undefined)}` : ""}</span></dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function useField<K extends keyof ProfileDraft>(key: K) {
  const value = useProfileDraft((s) => s.draft![key]);
  const setField = useProfileDraft((s) => s.setField);
  return [value, (v: ProfileDraft[K]) => setField(key, v)] as const;
}

function TextInput({
  name,
  label,
  hint,
  error,
  optional,
  placeholder,
  autoComplete,
}: {
  name: keyof ProfileDraft;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [value, setValue] = useField(name);
  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      {(props) => (
        <input {...props} autoComplete={autoComplete} placeholder={placeholder} value={(value as string | null) ?? ""} onChange={(e) => setValue(e.target.value as never)} />
      )}
    </Field>
  );
}

function BasicsStep({ errors }: { errors: Errors }) {
  const [intro, setIntro] = useField("intro");
  const introFlags = detectSensitive(intro);
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput name="first_name" label="First name" autoComplete="given-name" error={errors.first_name} />
        <TextInput name="last_name" label="Last name" autoComplete="family-name" error={errors.last_name} />
      </div>
      <TextInput name="headline" label="Headline" placeholder="Nurse at St James's, quiet non-smoker" hint="One line. Landlords skim, so lead with what matters." error={errors.headline} />
      <Field label="About you" hint={`${intro.length}/1200 · A few sentences about you, your routine and what you're looking for.`} error={errors.intro}>
        {(props) => (
          <textarea {...props} rows={6} maxLength={1200} value={intro} onChange={(e) => setIntro(e.target.value)} className={`${props.className} leading-6`} placeholder="I'm moving to Dublin for a new role at…" />
        )}
      </Field>
      {introFlags.map((f) => (
        <Alert key={f} tone="warning">{SENSITIVE_FLAG_COPY[f]}</Alert>
      ))}
    </>
  );
}

function JobStep({ errors }: { errors: Errors }) {
  const [type, setType] = useField("employment_type");
  return (
    <>
      <TextInput name="occupation" label="Occupation" placeholder="Software engineer" autoComplete="organization-title" error={errors.occupation} />
      <TextInput name="employer" label="Employer" optional placeholder="Company name" autoComplete="organization" error={errors.employer} />
      <fieldset>
        <legend className="mb-2 text-label font-semibold">Employment type</legend>
        <div className="flex flex-wrap gap-2">
          {employmentTypes.map((t) => (
            <label
              key={t}
              className={cn(
                "inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-label font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-focus",
                type === t ? "border-primary bg-primary-soft text-primary-ink" : "border-hairline text-muted hover:border-hairline-strong",
              )}
            >
              <input type="radio" name="employment_type" className="sr-only" checked={type === t} onChange={() => setType(t)} />
              {EMPLOYMENT_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
        {errors.employment_type && <p className="mt-1.5 text-[13px] text-danger">{errors.employment_type}</p>}
      </fieldset>
    </>
  );
}

function NumberInput({ name, label, error, min, max, prefix }: { name: "budget_min" | "budget_max" | "household_size"; label: string; error?: string; min?: number; max?: number; prefix?: string }) {
  const [value, setValue] = useField(name);
  return (
    <Field label={label} error={error}>
      {(props) => (
        <div className="relative">
          {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{prefix}</span>}
          <input
            {...props}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value))}
            className={cn(props.className, "tabular", prefix && "pl-7")}
          />
        </div>
      )}
    </Field>
  );
}

function HouseholdStep({ errors }: { errors: Errors }) {
  const [moveIn, setMoveIn] = useField("move_in_date");
  const [smoker, setSmoker] = useField("smoker");
  return (
    <>
      <Field label="Move-in date" error={errors.move_in_date}>
        {(props) => <input {...props} type="date" value={moveIn ?? ""} onChange={(e) => setMoveIn(e.target.value || null)} />}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <NumberInput name="budget_min" label="Budget from" prefix="€" min={0} error={errors.budget_min} />
        <NumberInput name="budget_max" label="Up to" prefix="€" min={0} error={errors.budget_max} />
      </div>
      <p className="-mt-3 text-[13px] text-muted">Per month.</p>
      <NumberInput name="household_size" label="People moving in" min={1} max={12} error={errors.household_size} />
      <TextInput name="pets" label="Pets" optional placeholder="One indoor cat" error={errors.pets} />
      <div>
        <p className="mb-2 text-label font-semibold">Do you smoke?</p>
        <Segmented<"no" | "yes" | "unset">
          label="Do you smoke?"
          value={smoker === null ? "unset" : smoker ? "yes" : "no"}
          onChange={(v) => setSmoker(v === "unset" ? null : v === "yes")}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Yes" },
            { value: "unset", label: "Rather not say" },
          ]}
        />
      </div>
    </>
  );
}

function RepeatCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-hairline p-4">
      <div className="mb-3 flex items-center justify-between">
        <legend className="eyebrow text-muted">{title}</legend>
        <button type="button" onClick={onRemove} className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-rose-soft hover:text-rose-ink" aria-label={`Remove ${title.toLowerCase()}`}>
          <TrashIcon size={16} />
        </button>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-strong text-sm font-semibold text-muted transition-colors hover:border-primary hover:text-primary-ink">
      <PlusIcon size={16} /> {children}
    </button>
  );
}

function HistoryStep({ errors }: { errors: Errors }) {
  const [history, setHistory] = useField("rental_history");
  const update = (i: number, patch: Partial<ProfileDraft["rental_history"][number]>) => setHistory(history.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  return (
    <>
      {history.map((h, i) => (
        <RepeatCard key={i} title={`Home ${i + 1}`} onRemove={() => setHistory(history.filter((_, j) => j !== i))}>
          <Field label="Address or area" error={errors[`rental_history.${i}.address`]}>
            {(props) => <input {...props} placeholder="Ranelagh, Dublin 6" value={h.address} onChange={(e) => update(i, { address: e.target.value })} />}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From" error={errors[`rental_history.${i}.from`]}>
              {(props) => <input {...props} type="month" value={h.from} onChange={(e) => update(i, { from: e.target.value })} />}
            </Field>
            <Field label="To" hint="Blank if current" error={errors[`rental_history.${i}.to`]}>
              {(props) => <input {...props} type="month" value={h.to ?? ""} onChange={(e) => update(i, { to: e.target.value })} />}
            </Field>
          </div>
          <Field label="Landlord or agency" optional>
            {(props) => <input {...props} value={h.landlordName ?? ""} onChange={(e) => update(i, { landlordName: e.target.value })} />}
          </Field>
        </RepeatCard>
      ))}
      {history.length < 10 && <AddButton onClick={() => setHistory([...history, { address: "", from: "" }])}>Add a home</AddButton>}
    </>
  );
}

function ReferencesStep({ errors }: { errors: Errors }) {
  const [refs, setRefs] = useField("references");
  const update = (i: number, patch: Partial<ProfileDraft["references"][number]>) => setRefs(refs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <>
      {refs.map((r, i) => (
        <RepeatCard key={i} title={`Reference ${i + 1}`} onRemove={() => setRefs(refs.filter((_, j) => j !== i))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors[`references.${i}.name`]}>
              {(props) => <input {...props} value={r.name} onChange={(e) => update(i, { name: e.target.value })} />}
            </Field>
            <Field label="Relationship" error={errors[`references.${i}.relationship`]}>
              {(props) => <input {...props} placeholder="Previous landlord" value={r.relationship} onChange={(e) => update(i, { relationship: e.target.value })} />}
            </Field>
            <Field label="Email" optional hint="Private" error={errors[`references.${i}.email`]}>
              {(props) => <input {...props} type="email" value={r.email ?? ""} onChange={(e) => update(i, { email: e.target.value })} />}
            </Field>
            <Field label="Phone" optional hint="Private">
              {(props) => <input {...props} type="tel" value={r.phone ?? ""} onChange={(e) => update(i, { phone: e.target.value })} />}
            </Field>
          </div>
        </RepeatCard>
      ))}
      {refs.length < 5 && <AddButton onClick={() => setRefs([...refs, { name: "", relationship: "" }])}>Add a reference</AddButton>}
    </>
  );
}

function PhotoStep({ photoUrl, setPhotoUrl }: { photoUrl: string | null; setPhotoUrl: (url: string | null) => void }) {
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const name = useProfileDraft((s) => `${s.draft?.first_name ?? ""} ${s.draft?.last_name ?? ""}`);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) return setError("Photos must be 5 MB or smaller.");
    setStatus("uploading");
    setError(null);
    try {
      const { path, token } = await api<{ path: string; token: string }>("/api/profile/photo", { method: "POST", body: { mimeType: file.type, sizeBytes: file.size } });
      const { error: uploadError } = await getBrowserClient().storage.from("photos").uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) throw new Error("Upload failed. Please try again.");
      const result = await api<{ photoUrl: string | null }>("/api/profile/photo", { method: "PUT", body: { path } });
      setPhotoUrl(result.photoUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center sm:flex-row sm:text-left">
      <Avatar name={name} src={photoUrl} size={112} className="text-[40px]" />
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">A recent, well-lit photo of your face. JPEG, PNG or WebP, up to 5 MB.</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button variant="secondary" disabled={status === "uploading"} onClick={() => inputRef.current?.click()}>
            {status === "uploading" ? "Uploading…" : photoUrl ? "Change photo" : "Choose photo"}
          </Button>
          {photoUrl && (
            <Button
              variant="quiet-danger"
              onClick={async () => {
                await api("/api/profile/photo", { method: "DELETE" });
                setPhotoUrl(null);
              }}
            >
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>
    </div>
  );
}
