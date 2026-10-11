"use client";

import { useRef, useState, type DragEvent } from "react";
import { DocumentIcon } from "@/components/document-icon";
import { AlertIcon, LockIcon, MoreIcon, PencilIcon, RefreshIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { Alert, Button, Card, Field, Pill, Skeleton, cn } from "@/components/ui";
import { useDeleteDocument, useDocuments, useUpdateDocument, useUploadDocument } from "@/hooks/use-documents";
import { formatBytes, formatDate } from "@/lib/format";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from "@/lib/security/file-type";
import { SENSITIVE_FLAG_COPY, type SensitiveFlag } from "@/lib/security/sensitive";
import type { DocumentCategory, DocumentRow } from "@/lib/types";
import { DOCUMENT_CATEGORY_LABELS, documentCategories } from "@/schemas/document";

const SUGGESTED: { category: DocumentCategory; hint: string }[] = [
  { category: "employment_letter", hint: "Confirms your role and salary" },
  { category: "payslip", hint: "Your last two or three" },
  { category: "landlord_reference", hint: "From a previous landlord" },
  { category: "id", hint: "Usually only at signing" },
];

function validateFile(file: File): string | null {
  if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) return "Use a PDF, JPEG, PNG or WebP file.";
  if (file.size > MAX_DOCUMENT_BYTES) return "Files must be 10 MB or smaller.";
  return null;
}

type UploadTarget = { file: File | null; replace?: DocumentRow; category?: DocumentCategory };

export function DocumentVault() {
  const { data, isPending, error } = useDocuments();
  const [target, setTarget] = useState<UploadTarget | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCategory = useRef<DocumentCategory | undefined>(undefined);

  const pick = (category?: DocumentCategory) => {
    pendingCategory.current = category;
    inputRef.current?.click();
  };

  const accept = (file: File | undefined) => {
    if (!file) return;
    const problem = validateFile(file);
    setFileError(problem);
    if (!problem) setTarget({ file, category: pendingCategory.current });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  const have = new Set(data?.map((d) => d.category));
  const missing = SUGGESTED.filter((s) => !have.has(s.category));

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_DOCUMENT_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => pick()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors sm:flex-row sm:text-left",
          dragging ? "border-primary bg-primary-soft" : "border-hairline-strong bg-surface hover:border-primary hover:bg-primary-soft/40",
        )}
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
          <UploadIcon size={22} />
        </span>
        <span className="sm:flex-1">
          <span className="block font-display text-subtitle font-semibold">Add a document</span>
          <span className="block text-sm text-muted">
            <span className="hidden sm:inline">Drop a file here or click to browse. </span>PDF, JPEG, PNG or WebP up to 10 MB.
          </span>
        </span>
      </button>
      {fileError && <Alert tone="danger">{fileError}</Alert>}

      {isPending && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}
      {error && <Alert tone="danger">{error.message}</Alert>}

      {data && data.length > 0 && (
        <section aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="eyebrow mb-3 text-muted">
            Your documents · {data.length}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((doc) => (
              <DocumentTile key={doc.id} doc={doc} onReplace={() => setTarget({ file: null, replace: doc })} />
            ))}
          </ul>
        </section>
      )}

      {data && missing.length > 0 && (
        <section aria-labelledby="suggested-heading">
          <h2 id="suggested-heading" className="eyebrow mb-3 text-muted">Landlords usually ask for</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {missing.map((s) => (
              <li key={s.category}>
                <button
                  type="button"
                  onClick={() => pick(s.category)}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-hairline-strong bg-surface p-4 text-left transition-colors hover:border-primary"
                >
                  <DocumentIcon category={s.category} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{DOCUMENT_CATEGORY_LABELS[s.category]}</span>
                    <span className="block text-[13px] text-muted">{s.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            You never need to share your PPS number or full bank statements. We&apos;ll warn you if a PDF looks like it contains them.
          </p>
        </section>
      )}

      <UploadSheet target={target} onClose={() => setTarget(null)} />
    </div>
  );
}

function DocumentTile({ doc, onReplace }: { doc: DocumentRow; onReplace: () => void }) {
  const remove = useDeleteDocument();
  const update = useUpdateDocument();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(doc.label);

  return (
    <li>
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="locked-stripes flex items-start gap-3 border-b border-hairline p-4">
          <DocumentIcon category={doc.category} className="bg-surface" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{doc.label}</p>
            <p className="text-[13px] text-muted">{DOCUMENT_CATEGORY_LABELS[doc.category]}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={`Actions for ${doc.label}`}
            className="-mr-2 -mt-1 inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-ink"
          >
            <MoreIcon />
          </button>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 p-4">
          <Pill icon={<LockIcon size={11} />}>Locked</Pill>
          {doc.sensitive_flags.length > 0 && (
            <Pill tone="pending" icon={<AlertIcon size={11} />}>
              Check for PPS/bank details
            </Pill>
          )}
          <span className="tabular ml-auto text-[12px] text-muted">
            {doc.mime_type === "application/pdf" ? "PDF" : "Image"} · {formatBytes(doc.size_bytes)} · {formatDate(doc.uploaded_at)}
          </span>
        </div>
      </Card>

      <Sheet open={menuOpen} onClose={() => { setMenuOpen(false); setRenaming(false); }} title={doc.label}>
        {renaming ? (
          <form
            className="flex flex-col gap-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({ id: doc.id, label }, { onSuccess: () => { setRenaming(false); setMenuOpen(false); } });
            }}
          >
            <Field label="Label" hint="Landlords see this name when choosing what to request.">
              {(props) => <input {...props} autoFocus value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />}
            </Field>
            <Button type="submit" size="lg" disabled={update.isPending}>Save</Button>
          </form>
        ) : (
          <ul className="py-2">
            {[
              { label: "Rename", Icon: PencilIcon, action: () => setRenaming(true) },
              { label: "Replace file", Icon: RefreshIcon, action: () => { setMenuOpen(false); onReplace(); } },
            ].map(({ label: text, Icon, action }) => (
              <li key={text}>
                <button type="button" onClick={action} className="flex min-h-13 w-full items-center gap-3 px-5 text-left font-medium hover:bg-hover">
                  <Icon size={20} className="text-muted" /> {text}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`Delete “${doc.label}”? Anyone with access loses it immediately.`)) {
                    remove.mutate(doc.id);
                    setMenuOpen(false);
                  }
                }}
                className="flex min-h-13 w-full items-center gap-3 px-5 text-left font-medium text-rose-ink hover:bg-rose-soft"
              >
                <TrashIcon size={20} /> Delete
              </button>
            </li>
          </ul>
        )}
      </Sheet>
    </li>
  );
}

function UploadSheet({ target, onClose }: { target: UploadTarget | null; onClose: () => void }) {
  return (
    <Sheet open={!!target} onClose={onClose} title={target?.replace ? "Replace file" : "Add to vault"}>
      {target && <UploadForm key={target.replace?.id ?? target.file?.name} target={target} onDone={onClose} />}
    </Sheet>
  );
}

function UploadForm({ target, onDone }: { target: UploadTarget; onDone: () => void }) {
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(target.file);
  const [category, setCategory] = useState<DocumentCategory>(target.replace?.category ?? target.category ?? "employment_letter");
  const [label, setLabel] = useState(target.replace?.label ?? "");
  const [fileError, setFileError] = useState<string | null>(null);
  const warnings = (upload.data?.sensitive_flags ?? []) as SensitiveFlag[];

  if (upload.isSuccess) {
    return (
      <div className="flex flex-col gap-4 p-5">
        {warnings.length > 0 ? (
          <Alert tone="warning" title="Uploaded, but take a look">
            {warnings.map((w) => SENSITIVE_FLAG_COPY[w]).join(" ")} You can replace it with a redacted copy from the vault.
          </Alert>
        ) : (
          <Alert tone="success" title="Saved to your vault">It stays locked until you approve a request.</Alert>
        )}
        <Button size="lg" onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return setFileError("Choose a file");
        upload.mutate({ file, category, label: label.trim() || DOCUMENT_CATEGORY_LABELS[category], replacesId: target.replace?.id });
      }}
    >
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-sunken p-3">
          <DocumentIcon category={category} className="bg-surface" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-[12px] text-muted">{formatBytes(file.size)}</p>
          </div>
        </div>
      ) : (
        <Field label="File" error={fileError ?? undefined} hint="PDF, JPEG, PNG or WebP up to 10 MB">
          {(props) => (
            <input
              {...props}
              type="file"
              accept={ALLOWED_DOCUMENT_TYPES.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                const problem = f ? validateFile(f) : null;
                setFileError(problem);
                setFile(problem ? null : (f ?? null));
              }}
            />
          )}
        </Field>
      )}

      {!target.replace && (
        <fieldset>
          <legend className="mb-2 text-label font-semibold">Type</legend>
          <div className="flex flex-wrap gap-2">
            {documentCategories.map((c) => (
              <label
                key={c}
                className={cn(
                  "inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-label font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-focus",
                  category === c ? "border-primary bg-primary-soft text-primary-ink" : "border-hairline text-muted hover:border-hairline-strong",
                )}
              >
                <input type="radio" name="category" className="sr-only" checked={category === c} onChange={() => setCategory(c)} />
                {DOCUMENT_CATEGORY_LABELS[c]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {!target.replace && (
        <Field label="Label" optional hint="What landlords see, e.g. “Payslip, September”.">
          {(props) => <input {...props} value={label} maxLength={80} placeholder={DOCUMENT_CATEGORY_LABELS[category]} onChange={(e) => setLabel(e.target.value)} />}
        </Field>
      )}

      {upload.error && <Alert tone="danger">{upload.error.message}</Alert>}
      <Button type="submit" size="lg" disabled={upload.isPending || !file}>
        {upload.isPending ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" /> Uploading securely…
          </>
        ) : target.replace ? (
          "Replace file"
        ) : (
          "Save to vault"
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted">
        <LockIcon size={12} /> Stored privately in the EU. Never sent to AI.
      </p>
    </form>
  );
}
