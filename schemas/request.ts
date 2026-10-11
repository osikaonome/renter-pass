import { z } from "zod";

// Requester (landlord) side
export const verifyStartSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.email("Enter a valid email").max(254),
  // Acknowledgement of the transparency notice (legitimate-interest basis).
  acceptNotice: z.literal(true, { error: "Please confirm you've read the notice" }),
});

export const verifyConfirmSchema = z.object({
  verificationId: z.uuid(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const createRequestSchema = z.object({
  documentIds: z.array(z.uuid()).min(1, "Choose at least one document").max(20),
  message: z.string().trim().max(500).optional(),
});

// Renter side
export const decisionSchema = z.object({
  approvedDocumentIds: z.array(z.uuid()).max(20),
  // Everything of mine in the request that isn't approved is declined.
  expiresInHours: z.number().int().min(1).max(720),
});
