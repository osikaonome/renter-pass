import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Name your household").max(80),
});

export const updateHouseholdSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    move_in_date: z.iso.date().nullable(),
    combined_budget: z.number().int().min(0).max(50000).nullable(),
    summary: z.string().trim().max(1000).nullable(),
  })
  .partial()
  .strict();

export const inviteSchema = z.object({
  email: z.email("Enter a valid email").max(254),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(100),
});
