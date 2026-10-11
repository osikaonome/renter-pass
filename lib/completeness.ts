import type { Profile } from "@/lib/types";

type Check = { key: string; label: string; weight: number; done: (p: Profile, docs: string[]) => boolean };

// What landlords most commonly ask for, weighted by how much they matter.
const CHECKS: Check[] = [
  { key: "name", label: "Add your name", weight: 10, done: (p) => !!p.first_name && !!p.last_name },
  { key: "headline", label: "Write a one-line headline", weight: 5, done: (p) => p.headline.length > 0 },
  { key: "intro", label: "Write a short introduction", weight: 10, done: (p) => p.intro.length >= 80 },
  { key: "photo", label: "Add a photo", weight: 5, done: (p) => !!p.photo_path },
  { key: "job", label: "Add your job", weight: 15, done: (p) => !!p.occupation && !!p.employment_type },
  { key: "move_in", label: "Set your move-in date", weight: 10, done: (p) => !!p.move_in_date },
  { key: "budget", label: "Set your budget", weight: 10, done: (p) => p.budget_max != null },
  { key: "history", label: "Add rental history", weight: 10, done: (p) => p.rental_history.length > 0 },
  { key: "references", label: "Add a reference", weight: 10, done: (p) => p.references.length > 0 },
  {
    key: "employment_letter",
    label: "Upload an employment letter",
    weight: 10,
    done: (_, docs) => docs.includes("employment_letter"),
  },
  {
    key: "landlord_reference",
    label: "Upload a landlord reference",
    weight: 5,
    done: (_, docs) => docs.includes("landlord_reference"),
  },
];

export function profileCompleteness(profile: Profile, documentCategories: string[]) {
  const total = CHECKS.reduce((sum, c) => sum + c.weight, 0);
  const missing = CHECKS.filter((c) => !c.done(profile, documentCategories));
  const score = total - missing.reduce((sum, c) => sum + c.weight, 0);
  return {
    percent: Math.round((score / total) * 100),
    missing: missing.map(({ key, label }) => ({ key, label })),
  };
}
