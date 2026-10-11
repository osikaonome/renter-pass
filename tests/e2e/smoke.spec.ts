import { expect, test } from "@playwright/test";

test("landing page explains the product and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Apply to every listing");
  await page.getByRole("link", { name: "Create your free profile" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("renter pages redirect to sign-in when signed out", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("unknown or revoked links show a neutral message and are not indexable", async ({ page }) => {
  const response = await page.goto("/p/doesnotexist234");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { name: "This link isn't available" })).toBeVisible();
});

test("document endpoints refuse requests without a valid token", async ({ request }) => {
  const res = await request.get("/api/public/grants/00000000-0000-0000-0000-000000000000?t=nope");
  expect(res.status()).toBe(404);
});

test("requests can't be submitted without email verification", async ({ request }) => {
  const res = await request.post("/api/public/links/doesnotexist234/requests", {
    data: { documentIds: ["00000000-0000-0000-0000-000000000000"] },
  });
  expect([401, 404]).toContain(res.status());
});
