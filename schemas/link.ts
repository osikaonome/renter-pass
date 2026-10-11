import { z } from "zod";

export const createLinkSchema = z
  .object({
    label: z.string().trim().min(1, "Give the link a name").max(80),
    listingUrl: z.url({ protocol: /^https?$/ }).or(z.literal("")).optional(),
    listingText: z.string().trim().max(8000).optional(),
    message: z.string().trim().max(2000).optional(),
    kind: z.enum(["solo", "household"]),
    householdId: z.uuid().optional(),
  })
  .refine((v) => v.kind === "solo" || v.householdId, {
    message: "Choose a household",
    path: ["householdId"],
  });

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export const updateLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    message: z.string().trim().max(2000),
    revoked: z.literal(true),
  })
  .partial()
  .strict();
