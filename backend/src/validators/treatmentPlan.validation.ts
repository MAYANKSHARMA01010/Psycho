import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ message: "Must be a valid ISO datetime" })
  .transform((s) => new Date(s));

export const createTreatmentPlanSchema = {
  body: z.object({
    clientId: z.string().uuid("Invalid client id"),
    assessmentId: z.string().uuid("Invalid assessment id"),
    goals: z.string().trim().min(10).max(5000),
    milestones: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(100).optional(),
          title: z.string().trim().min(2).max(200),
          description: z.string().trim().max(1000).optional(),
          progress: z.number().min(0).max(100).optional(),
        }),
      )
      .min(1, "At least one milestone is required")
      .max(100),
    startDate: isoDate,
    endDate: isoDate.optional(),
  }),
};

export const treatmentPlanIdParamSchema = {
  params: z.object({
    planId: z.string().uuid("Invalid treatment plan id"),
  }),
};

export const milestoneParamSchema = {
  params: z.object({
    planId: z.string().uuid("Invalid treatment plan id"),
    milestoneId: z.string().trim().min(1).max(200),
  }),
};

export const updateMilestoneProgressSchema = {
  body: z.object({
    progress: z.number().min(0).max(100),
    note: z.string().trim().max(1000).optional(),
  }),
};

export const updateTreatmentPlanStatusSchema = {
  body: z.object({
    status: z.enum(["active", "paused", "completed"]),
  }),
};

export const treatmentPlanListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
