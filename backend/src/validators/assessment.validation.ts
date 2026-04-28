import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ message: "Must be a valid ISO datetime" })
  .transform((s) => new Date(s));

export const submitAssessmentSchema = {
  body: z.object({
    responses: z
      .union([z.record(z.string(), z.any()), z.array(z.any())])
      .refine((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return Object.keys(value).length > 0;
      }, "responses cannot be empty"),
    completedAt: isoDate.optional(),
  }),
};

export const assessmentIdParamSchema = {
  params: z.object({
    assessmentId: z.string().uuid("Invalid assessment id"),
  }),
};

export const clientIdParamSchema = {
  params: z.object({
    clientId: z.string().uuid("Invalid client id"),
  }),
};

export const assessmentListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
