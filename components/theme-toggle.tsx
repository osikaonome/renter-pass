"use client";

import { useSyncExternalStore } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/components/ui";
import { THEME_STORAGE_KEY, applyTheme, readThemePreference, type ThemePreference } from "@/lib/theme";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === THEME_STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useThemePreference() {
  const preference = useSyncExternalStore<ThemePreference>(subscribe, readThemePreference, () => "system");
  const set = (value: ThemePreference) => {
    applyTheme(value);
    listeners.forEach((l) => l());
  };
  return [preference, set] as const;
}

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

/** Three-way theme control. `compact` shows icons only (sidebar, menus). */
export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [preference, setPreference] = useThemePreference();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-lg border border-hairline bg-sunken p-0.5", className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={compact ? label : undefined}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-label font-semibold transition-colors",
              active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
            )}
          >
            <Icon size={16} />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
}
