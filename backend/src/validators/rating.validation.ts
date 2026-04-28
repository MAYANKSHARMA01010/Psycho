import { z } from "zod";

export const createRatingSchema = {
  body: z.object({
    sessionId: z.string().uuid("Invalid session id"),
    score: z.number().int().min(1).max(5),
    review: z.string().trim().max(2000).optional(),
  }),
};

export const therapistIdParamSchema = {
  params: z.object({
    therapistId: z.string().uuid("Invalid therapist id"),
  }),
};

export const ratingListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
