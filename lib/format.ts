const TZ = "Europe/Dublin";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });
}

export function formatMonth(value: string | undefined): string {
  if (!value) return "present";
  const [y, m] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IE", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatEuro(value: number | null | undefined): string {
  if (value == null) return "";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function formatBudget(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${formatEuro(min)}–${formatEuro(max)} / month`;
  if (max != null) return `Up to ${formatEuro(max)} / month`;
  if (min != null) return `From ${formatEuro(min)} / month`;
  return "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function timeUntil(value: string): string {
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "less than an hour";
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${Math.round(hours / 24)} days`;
}

/** "just now", "5 min ago", "3 h ago", "yesterday", then a date. */
export function formatRelative(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return "yesterday";
  return formatDate(value);
}

export function greeting(date = new Date()): string {
  const hour = Number(date.toLocaleString("en-IE", { hour: "numeric", hour12: false, timeZone: TZ }));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
