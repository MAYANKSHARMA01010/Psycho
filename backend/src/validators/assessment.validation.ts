import { z } from "zod";

export const submitAssessmentSchema = {
  body: z.object({
    type: z.enum(["PHQ9", "GAD7", "CUSTOM"]),
    responses: z.array(z.number().int().min(0).max(3)).min(1).max(50),
  }),
};

export const assessmentIdParamSchema = {
  params: z.object({ assessmentId: z.string().uuid() }),
};

export const listAssessmentsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
};

export const clientIdParamSchema = {
  params: z.object({ clientId: z.string().uuid() }),
};

export const createTreatmentPlanSchema = {
  body: z.object({
    clientId: z.string().uuid(),
    assessmentId: z.string().uuid(),
    goals: z.string().trim().min(10).max(2000),
    milestones: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(200),
          description: z.string().trim().max(2000).optional(),
        }),
      )
      .min(1)
      .max(50),
    startDate: z.string().datetime().transform((s) => new Date(s)).optional(),
    endDate: z.string().datetime().transform((s) => new Date(s)).optional(),
  }),
};

export const planIdParamSchema = {
  params: z.object({ planId: z.string().uuid() }),
};

export const milestoneParamSchema = {
  params: z.object({
    planId: z.string().uuid(),
    milestoneId: z.string().uuid(),
  }),
};
