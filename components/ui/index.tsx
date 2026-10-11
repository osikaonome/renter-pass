import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { extendTailwindMerge } from "tailwind-merge";
import { AlertIcon, CheckIcon, InfoIcon, ShieldCheckIcon } from "@/components/icons";

// tailwind-merge resolves conflicts so a caller's classes override a component's
// defaults (`hidden` beats `inline-flex`, `px-6` beats `px-4`). It needs to know
// the custom scale names from globals.css, or it would read `text-title` as a
// colour and drop it next to `text-ink`.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "display-sm", "headline", "title", "subtitle", "label"],
      shadow: ["card", "raised", "overlay"],
      font: ["display"],
    },
  },
});

export function cn(...classes: (string | false | null | undefined)[]) {
  return merge(classes);
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet-danger";
type Size = "md" | "lg" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover shadow-card",
  secondary: "border border-hairline bg-surface text-ink hover:border-hairline-strong hover:bg-hover shadow-card",
  ghost: "text-ink hover:bg-sunken",
  danger: "border border-rose-line bg-rose-soft text-rose-ink hover:border-rose-ink/40",
  "quiet-danger": "text-rose-ink hover:bg-rose-soft",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3 text-label gap-1.5",
  md: "min-h-11 px-4 text-sm gap-2",
  lg: "min-h-12 px-5 text-[15px] gap-2",
};

export function buttonClass(variant: Variant = "primary", className?: string, size: Size = "md") {
  return cn(
    "inline-flex select-none items-center justify-center rounded font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, className, size)} {...props} />;
}

export function IconButton({ label, className, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-lg border border-hairline bg-surface shadow-card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
      <div className="min-w-0">
        <h2 id={id} className="text-subtitle font-semibold">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2 text-muted">{eyebrow}</p>}
        <h1 className="text-headline font-semibold text-ink sm:text-[2rem] sm:leading-10">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-sunken text-muted">{icon}</div>
      <h3 className="mt-4 text-subtitle font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full min-h-11 rounded border border-hairline-strong bg-surface px-3 py-2 text-base text-ink placeholder:text-subtle transition-[border-color,box-shadow] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger sm:text-[15px] disabled:opacity-60";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; className: string }) => ReactNode;
};

/** Label, hint and error wired up with ids for screen readers. */
export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-label font-semibold text-ink">
        {label}
        {optional && <span className="font-normal text-subtle">Optional</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, className: inputClass })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] leading-5 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-[13px] leading-5 text-danger">
          <AlertIcon size={14} />
          {error}
        </p>
      )}
    </div>
  );
}

/** Accessible switch built on a native checkbox. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-[13px] leading-5 text-muted">{description}</span>}
      </label>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-6 w-10 cursor-pointer appearance-none rounded-full bg-hairline-strong transition-colors checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-card transition-transform peer-checked:translate-x-4 dark:peer-checked:bg-on-primary"
        />
      </span>
    </div>
  );
}

/** Single-choice control rendered as a row of segments (radio group). */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={className}>
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex w-full rounded-lg border border-hairline bg-sunken p-1 sm:w-auto">
        {options.map((o) => (
          <label
            key={String(o.value)}
            className="relative flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded px-3 text-label font-semibold text-muted transition-colors has-checked:bg-surface has-checked:text-ink has-checked:shadow-card has-focus-visible:outline-2 has-focus-visible:outline-focus sm:flex-none"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-hairline bg-sunken text-ink",
    warning: "border-amber-line bg-amber-soft text-ink",
    danger: "border-rose-line bg-rose-soft text-ink",
    success: "border-primary-line bg-primary-soft text-ink",
  };
  const icons = {
    info: <InfoIcon size={18} className="text-muted" />,
    warning: <AlertIcon size={18} className="text-amber-ink" />,
    danger: <AlertIcon size={18} className="text-rose-ink" />,
    success: <CheckIcon size={18} className="text-primary-ink" />,
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border p-3.5 text-sm leading-5", tones[tone], className)}
    >
      <span className="mt-px shrink-0">{icons[tone]}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5 text-muted" : undefined}>{children}</div>
      </div>
    </div>
  );
}

type Tone = "neutral" | "verified" | "pending" | "danger" | "solid";

const PILL_TONES: Record<Tone, string> = {
  neutral: "border-hairline bg-sunken text-muted",
  verified: "border-primary-line bg-primary-soft text-primary-ink",
  pending: "border-amber-line bg-amber-soft text-amber-ink",
  danger: "border-rose-line bg-rose-soft text-rose-ink",
  solid: "border-transparent bg-ink text-canvas",
};

/** Status pill. Fully rounded per the design system: status, not structure. */
export function Pill({ children, tone = "neutral", icon, className }: { children: ReactNode; tone?: Tone; icon?: ReactNode; className?: string }) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5", PILL_TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function VerifiedPill({ children }: { children: ReactNode }) {
  return (
    <Pill tone="verified" icon={<ShieldCheckIcon size={12} strokeWidth={2.25} />}>
      {children}
    </Pill>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-sunken", className)} />;
}

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs from a private bucket
      <img src={src} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-display font-semibold text-primary-ink", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

/** Uppercase key + tabular value: the metric card from the design system. */
export function Metric({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-hairline bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow text-muted">{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <span className="tabular mt-2 font-display text-title font-semibold text-ink sm:text-headline">{value}</span>
      {hint && <span className="mt-1 text-[13px] leading-5 text-muted">{hint}</span>}
    </div>
  );
}

/** A definition row used across profile and request screens. */
export function DataRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-row py-3 last:border-0 sm:flex-row sm:gap-6">
      <dt className="eyebrow shrink-0 pt-0.5 text-muted sm:w-36">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}
