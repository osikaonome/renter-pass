"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/types";

export const STEPS = ["basics", "job", "household", "history", "references", "photo"] as const;
export type Step = (typeof STEPS)[number];

export type ProfileDraft = Pick<
  Profile,
  | "first_name"
  | "last_name"
  | "headline"
  | "intro"
  | "occupation"
  | "employer"
  | "employment_type"
  | "move_in_date"
  | "budget_min"
  | "budget_max"
  | "household_size"
  | "pets"
  | "smoker"
  | "rental_history"
  | "references"
>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

type State = {
  step: Step;
  draft: ProfileDraft | null;
  dirty: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  warnings: string[];
  hydrate: (profile: ProfileDraft) => void;
  setField: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  setStep: (step: Step) => void;
  setSaveStatus: (status: SaveStatus, error?: string | null) => void;
  setWarnings: (warnings: string[]) => void;
  markClean: () => void;
};

/**
 * Builder state. Only the current step is persisted to localStorage (so the
 * renter can resume where they left off); profile data itself is autosaved to
 * the server and never kept in browser storage.
 */
export const useProfileDraft = create<State>()(
  persist(
    (set) => ({
      step: "basics",
      draft: null,
      dirty: false,
      saveStatus: "idle",
      saveError: null,
      warnings: [],
      hydrate: (draft) => set({ draft, dirty: false }),
      setField: (key, value) =>
        set((s) => (s.draft ? { draft: { ...s.draft, [key]: value }, dirty: true, saveStatus: "idle" } : s)),
      setStep: (step) => set({ step }),
      setSaveStatus: (saveStatus, saveError = null) => set({ saveStatus, saveError }),
      setWarnings: (warnings) => set({ warnings }),
      markClean: () => set({ dirty: false }),
    }),
    { name: "rp-profile-builder", partialize: (s) => ({ step: s.step }) },
  ),
);
