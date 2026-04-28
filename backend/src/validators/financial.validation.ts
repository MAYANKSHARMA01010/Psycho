import { z } from "zod";

export const earningsQuerySchema = z.object({
  query: z.object({
    isPaid: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const requestWithdrawalSchema = z.object({
  body: z.object({
    amount: z.number().positive("Withdrawal amount must be greater than zero"),
  }),
});

export const withdrawalsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const processWithdrawalSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid withdrawal ID"),
  }),
  body: z.object({
    action: z.enum(["approve", "reject"], {
      message: "Action must be 'approve' or 'reject'",
    }),
    notes: z.string().max(500).optional(),
  }),
});

export const transactionHistoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
