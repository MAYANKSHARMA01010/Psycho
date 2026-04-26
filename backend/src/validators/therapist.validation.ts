import { z } from "zod";

const documentTypeSchema = z.enum(["LICENSE", "ID_PROOF", "DEGREE", "CERTIFICATE", "OTHER"]);

const workingHoursSchema = z.record(z.string(), z.any());
const bankAccountInfoSchema = z.record(z.string(), z.any());
const languagesSchema = z.array(z.string().trim().min(2).max(20)).max(20);

export const createTherapistProfileSchema = {
  body: z.object({
    licenseNumber: z.string().trim().min(3).max(100),
    specialization: z.string().trim().min(2).max(100),
    experience: z.number().int().min(0).max(60),
    workingHours: workingHoursSchema,
    languages: languagesSchema.optional(),
    bio: z.string().trim().min(10).max(2000).optional(),
    hourlyRate: z.number().nonnegative().max(100000).optional(),
    bankAccountInfo: bankAccountInfoSchema.optional(),
  }),
};

export const updateTherapistProfileSchema = {
  body: z
    .object({
      specialization: z.string().trim().min(2).max(100).optional(),
      experience: z.number().int().min(0).max(60).optional(),
      workingHours: workingHoursSchema.optional(),
      languages: languagesSchema.optional(),
      bio: z.string().trim().max(2000).nullable().optional(),
      hourlyRate: z.number().nonnegative().max(100000).nullable().optional(),
      bankAccountInfo: bankAccountInfoSchema.nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
};

export const therapistIdParamSchema = {
  params: z.object({
    therapistId: z.string().uuid("Invalid therapist id"),
  }),
};

export const uploadDocumentSchema = {
  body: z.object({
    type: documentTypeSchema,
    fileUrl: z.string().url("fileUrl must be a valid URL"),
    fileName: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
};

export const documentIdParamSchema = {
  params: z.object({
    documentId: z.string().uuid("Invalid document id"),
  }),
};

export const therapistSearchQuerySchema = {
  query: z.object({
    specialization: z.string().trim().min(2).max(100).optional(),
    language: z.string().trim().min(2).max(20).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    hasAvailability: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    search: z.string().trim().min(2).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sortBy: z.enum(["rating", "experience", "createdAt"]).default("rating"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
};

export const verificationListQuerySchema = {
  query: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

export const rejectTherapistSchema = {
  body: z.object({
    reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
  }),
};
