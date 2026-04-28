import { z } from "zod";

export const createSubscriptionSchema = z.object({
  body: z.object({
    planName: z.string().min(1, "Plan name is required"),
  }),
});

export const subscriptionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid subscription ID"),
  }),
});
