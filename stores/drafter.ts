"use client";

import { create } from "zustand";
import { revisionPrompt, type DraftTurn } from "@/schemas/ai";

type State = {
  /** Model turns after the facts prompt, with reasoning_details kept for follow-ups. */
  history: DraftTurn[];
  /** What's in the editor. Starts as the latest draft; the renter can edit it freely. */
  message: string;
  addDraft: (instruction: string | undefined, draft: Omit<DraftTurn, "role">) => void;
  setMessage: (message: string) => void;
  reset: () => void;
};

export const useDrafter = create<State>()((set) => ({
  history: [],
  message: "",
  addDraft: (instruction, draft) =>
    set((s) => ({
      history: [
        ...s.history,
        ...(instruction ? [{ role: "user" as const, content: revisionPrompt(instruction) }] : []),
        { role: "assistant" as const, ...draft },
      ].slice(-11), // stay within the API's 12-turn limit, always starting on a draft
      message: draft.content,
    })),
  setMessage: (message) => set({ message }),
  reset: () => set({ history: [], message: "" }),
}));
