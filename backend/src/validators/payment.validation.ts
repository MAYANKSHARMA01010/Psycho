import { z } from "zod";

export const initiatePaymentSchema = {
  body: z.object({
    sessionId: z.string().uuid(),
    amount: z.number().positive().max(1_000_000),
    method: z.string().trim().min(2).max(30).optional(),
  }),
};

export const refundPaymentSchema = {
  body: z.object({
    amount: z.number().positive().max(1_000_000).optional(),
    reason: z.string().trim().min(5).max(500),
  }),
};

export const paymentIdParamSchema = {
  params: z.object({
    paymentId: z.string().uuid(),
  }),
};

export const listPaymentsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  }),
};
