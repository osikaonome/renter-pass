import { defineConfig, devices } from "@playwright/test";

// Needs a running app with Supabase configured (.env.local). Locally: `npm run dev`
// in one terminal, then `npm run test:e2e`.
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 15"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run build && npm run start", url: "http://localhost:3000", timeout: 180_000, reuseExistingServer: true },
});
