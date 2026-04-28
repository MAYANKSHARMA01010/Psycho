import { z } from "zod";

export const requestWithdrawalSchema = {
  body: z.object({
    amount: z.number().positive().max(1_000_000),
    notes: z.string().trim().max(500).optional(),
  }),
};

export const listWithdrawalsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "PAID"]).optional(),
  }),
};

export const withdrawalIdParamSchema = {
  params: z.object({
    withdrawalId: z.string().uuid(),
  }),
};

export const rejectWithdrawalSchema = {
  body: z.object({
    reason: z.string().trim().min(5).max(500),
  }),
};
