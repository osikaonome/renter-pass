import { z } from "zod";

const month = z.string().regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const rentalHistoryEntrySchema = z.object({
  address: z.string().trim().min(1, "Add an address or area").max(200),
  from: month,
  to: month.or(z.literal("")).optional(),
  landlordName: z.string().trim().max(100).optional(),
});

export const referenceSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(100),
  relationship: z.string().trim().min(1, "e.g. Previous landlord, Employer").max(100),
  email: z.email().or(z.literal("")).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const employmentTypes = ["full_time", "part_time", "contract", "self_employed", "student", "other"] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<(typeof employmentTypes)[number], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  self_employed: "Self-employed",
  student: "Student",
  other: "Other",
};

// Each builder step validates only its own fields, so steps can autosave
// independently. The PATCH endpoint accepts any subset.
export const basicsStepSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(60),
  last_name: z.string().trim().min(1, "Required").max(60),
  headline: z.string().trim().max(120),
  intro: z.string().trim().max(1200),
});

export const jobStepSchema = z.object({
  occupation: z.string().trim().max(100),
  employer: optionalText(100),
  employment_type: z.enum(employmentTypes).nullable(),
});

export const householdStepSchema = z
  .object({
    move_in_date: z.iso.date().nullable(),
    budget_min: z.number().int().min(0).max(20000).nullable(),
    budget_max: z.number().int().min(0).max(20000).nullable(),
    household_size: z.number().int().min(1).max(12).nullable(),
    pets: optionalText(200),
    smoker: z.boolean().nullable(),
  })
  .refine((v) => v.budget_min == null || v.budget_max == null || v.budget_min <= v.budget_max, {
    message: "Minimum budget must be below maximum",
    path: ["budget_max"],
  });

export const historyStepSchema = z.object({
  rental_history: z.array(rentalHistoryEntrySchema).max(10),
});

export const referencesStepSchema = z.object({
  references: z.array(referenceSchema).max(5),
});

export const profilePatchSchema = z
  .object({
    ...basicsStepSchema.shape,
    ...jobStepSchema.shape,
    move_in_date: z.iso.date().nullable(),
    budget_min: z.number().int().min(0).max(20000).nullable(),
    budget_max: z.number().int().min(0).max(20000).nullable(),
    household_size: z.number().int().min(1).max(12).nullable(),
    pets: optionalText(200),
    smoker: z.boolean().nullable(),
    ...historyStepSchema.shape,
    ...referencesStepSchema.shape,
    photo_path: z.string().max(300).nullable(),
  })
  .partial()
  .strict();

export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export const settingsSchema = z
  .object({
    default_access_hours: z.number().int().min(1).max(720),
    notification_prefs: z.object({
      document_request: z.object({ email: z.boolean(), push: z.boolean() }),
      household_invite: z.object({ email: z.boolean(), push: z.boolean() }),
      link_viewed: z.object({ email_digest: z.boolean(), push: z.boolean() }),
    }),
  })
  .partial()
  .strict();
