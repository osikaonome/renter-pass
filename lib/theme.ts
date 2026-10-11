export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "rp-theme";

/**
 * Runs inline in <head> before first paint, so the saved theme (or the system
 * theme) is applied without a flash. Also follows OS changes while on "system".
 */
export const THEME_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}",d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var p=localStorage.getItem(k)||"system";d.setAttribute("data-theme",p==="system"?(m.matches?"dark":"light"):p)}a();m.addEventListener("change",function(){if((localStorage.getItem(k)||"system")==="system")a()})}catch(e){}})()`;

export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const resolved =
    preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  root.setAttribute("data-theme-switching", "");
  root.setAttribute("data-theme", resolved);
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  // Re-enable transitions after the switch has painted.
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
}

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}
