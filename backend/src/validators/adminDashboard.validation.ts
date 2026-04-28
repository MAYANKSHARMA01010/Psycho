import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ message: "Must be a valid ISO datetime" })
  .transform((value) => new Date(value));

export const analyticsQuerySchema = {
  query: z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
};

export const highRiskQuerySchema = {
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).default(30),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
};
