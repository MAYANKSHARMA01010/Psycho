import { z } from "zod";

export const createSubscriptionSchema = {
  body: z.object({
    plan: z.string().trim().min(2).max(50),
    autoRenew: z.boolean().default(true),
  }),
};

export const renewSubscriptionSchema = {
  body: z.object({
    plan: z.string().trim().min(2).max(50).optional(),
  }),
};
