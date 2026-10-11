import { describe, expect, it } from "vitest";
import { profileFacts, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { profileCompleteness } from "@/lib/completeness";
import type { Profile } from "@/lib/types";
import { createLinkSchema } from "@/schemas/link";
import { householdStepSchema, profilePatchSchema } from "@/schemas/profile";

const base: Profile = {
  id: "p1",
  user_id: "u1",
  email: "aoife@example.com",
  first_name: "Aoife",
  last_name: "Byrne",
  photo_path: null,
  headline: "Nurse at St James's",
  intro: "",
  occupation: "Nurse",
  employer: "St James's Hospital",
  employment_type: "full_time",
  move_in_date: "2026-12-01",
  budget_min: 1500,
  budget_max: 2000,
  pets: null,
  smoker: false,
  household_size: 1,
  rental_history: [],
  references: [{ name: "Mary Kelly", relationship: "Previous landlord", email: "mary@example.com", phone: "0871234567" }],
  notification_prefs: {
    document_request: { email: true, push: true },
    household_invite: { email: true, push: true },
    link_viewed: { email_digest: false, push: false },
  },
  default_access_hours: 72,
  created_at: "",
  updated_at: "",
};

describe("profileFacts (what the AI sees)", () => {
  const facts = profileFacts(base);

  it("includes the summary fields used for drafting", () => {
    expect(facts).toContain("First name: Aoife");
    expect(facts).toContain("Occupation: Nurse");
    expect(facts).toContain("References available: Previous landlord");
  });

  it("never includes surname, email or reference contact details", () => {
    expect(facts).not.toContain("Byrne");
    expect(facts).not.toContain("aoife@example.com");
    expect(facts).not.toContain("Mary Kelly");
    expect(facts).not.toContain("mary@example.com");
    expect(facts).not.toContain("0871234567");
  });

  it("system prompt forbids invention and protected characteristics", () => {
    expect(SYSTEM_PROMPT).toMatch(/Never invent/);
    expect(SYSTEM_PROMPT).toMatch(/housing assistance/);
  });
});

describe("profileCompleteness", () => {
  it("scores higher with documents and lists what's missing", () => {
    const without = profileCompleteness(base, []);
    const withDocs = profileCompleteness(base, ["employment_letter", "landlord_reference"]);
    expect(withDocs.percent).toBeGreaterThan(without.percent);
    expect(without.missing.map((m) => m.key)).toContain("employment_letter");
    expect(withDocs.missing.map((m) => m.key)).not.toContain("employment_letter");
  });
});

describe("schemas", () => {
  it("rejects a minimum budget above the maximum", () => {
    const result = householdStepSchema.safeParse({
      move_in_date: null, budget_min: 2500, budget_max: 2000, household_size: null, pets: null, smoker: null,
    });
    expect(result.success).toBe(false);
  });

  it("does not let the profile PATCH set ownership or bookkeeping fields", () => {
    expect(profilePatchSchema.safeParse({ user_id: "someone-else" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ email: "x@example.com" }).success).toBe(false);
  });

  it("requires a household for household links and rejects non-http listing URLs", () => {
    expect(createLinkSchema.safeParse({ label: "x", kind: "household" }).success).toBe(false);
    expect(createLinkSchema.safeParse({ label: "x", kind: "solo", listingUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(createLinkSchema.safeParse({ label: "x", kind: "solo", listingUrl: "https://www.daft.ie/x" }).success).toBe(true);
  });
});
