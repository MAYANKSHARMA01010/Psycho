import { z } from "zod";

export const raiseComplaintSchema = {
  body: z.object({
    againstId: z.string().uuid("Invalid againstId"),
    description: z.string().trim().min(10).max(5000),
  }),
};

export const complaintIdParamSchema = {
  params: z.object({
    complaintId: z.string().uuid("Invalid complaint id"),
  }),
};

export const reviewComplaintSchema = {
  body: z.object({
    action: z.enum(["under_review", "resolve", "dismiss", "escalate"]),
    resolution: z.string().trim().min(5).max(2000).optional(),
  }),
};

export const complaintListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    scope: z.enum(["raised", "against", "all"]).default("all").optional(),
    status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]).optional(),
  }),
};
