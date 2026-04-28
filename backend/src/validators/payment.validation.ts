import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid("Invalid session ID"),
    method: z.enum(["UPI", "CARD", "NET_BANKING", "WALLET"], {
      message: "Method must be UPI, CARD, NET_BANKING, or WALLET",
    }),
    currency: z.string().length(3).default("INR").optional(),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid("Invalid payment ID"),
    transactionId: z.string().min(1, "Transaction ID is required"),
    gatewayResponse: z.any().optional(),
  }),
});

export const refundPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid payment ID"),
  }),
  body: z.object({
    reason: z.string().min(5, "Please provide a refund reason").max(500),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid payment ID"),
  }),
});

export const paymentHistoryQuerySchema = z.object({
  query: z.object({
    status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
