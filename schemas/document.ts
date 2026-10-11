import { z } from "zod";

export const documentCategories = ["employment_letter", "landlord_reference", "id", "payslip", "other"] as const;

export const DOCUMENT_CATEGORY_LABELS: Record<(typeof documentCategories)[number], string> = {
  employment_letter: "Employment letter",
  landlord_reference: "Landlord reference",
  id: "Photo ID",
  payslip: "Payslip",
  other: "Other",
};

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024, "Files must be 10 MB or smaller"),
});

export const registerDocumentSchema = z.object({
  storagePath: z.string().min(1).max(300),
  category: z.enum(documentCategories),
  label: z.string().trim().min(1).max(80),
  // Set when replacing an existing document, which keeps its id and any requests.
  replacesId: z.uuid().optional(),
});

export const updateDocumentSchema = z.object({
  category: z.enum(documentCategories).optional(),
  label: z.string().trim().min(1).max(80).optional(),
});

export const photoUploadUrlSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024, "Photos must be 5 MB or smaller"),
});
