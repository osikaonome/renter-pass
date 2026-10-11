import { z } from "zod";

// Opaque reasoning blocks returned by OpenRouter. Passed back unchanged so the
// model keeps its reasoning context across "make it shorter" follow-ups.
const reasoningDetail = z.record(z.string(), z.unknown());

export const draftTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
  reasoning_details: z.array(reasoningDetail).max(50).optional(),
});

export const draftRequestSchema = z.object({
  listingText: z.string().trim().max(8000),
  householdId: z.uuid().optional(),
  // Turns after the profile/listing prompt (drafts and revision instructions).
  // The server always rebuilds the system prompt and facts. Empty on the first draft.
  history: z.array(draftTurnSchema).max(12).default([]),
  instruction: z.string().trim().max(300).optional(),
});

export type DraftTurn = z.infer<typeof draftTurnSchema>;

/** The exact user turn for a revision, shared so client history matches what the model saw. */
export function revisionPrompt(instruction: string): string {
  return `Revise the message: ${instruction}. Keep to the same rules and facts. Output only the message.`;
}
