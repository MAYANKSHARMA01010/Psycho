import { z } from "zod";

const channelSchema = z.enum(["PUSH", "EMAIL", "SMS"]);
const typeSchema = z.enum([
  "SESSION_REMINDER",
  "MEDICATION_REMINDER",
  "AI_NUDGE",
  "COMPLAINT_UPDATE",
  "PAYMENT_UPDATE",
  "CRISIS_ALERT",
]);

export const notificationIdParamSchema = {
  params: z.object({
    notificationId: z.string().uuid("Invalid notification id"),
  }),
};

export const listNotificationQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unreadOnly: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  }),
};

export const sendNotificationSchema = {
  body: z.object({
    userIds: z.array(z.string().uuid("Invalid user id")).min(1).max(500),
    type: typeSchema,
    channels: z.array(channelSchema).min(1).max(3),
    title: z.string().trim().min(2).max(200),
    message: z.string().trim().min(2).max(5000),
    metadata: z.record(z.string(), z.any()).optional(),
    clientId: z.string().uuid("Invalid client id").optional(),
  }),
};

export const sendSessionRemindersSchema = {
  body: z.object({
    withinHours: z.number().int().min(1).max(72).optional(),
    channels: z.array(channelSchema).min(1).max(3).optional(),
  }),
};

export const sendPaymentUpdateSchema = {
  body: z.object({
    paymentId: z.string().uuid("Invalid payment id"),
    title: z.string().trim().min(2).max(200).optional(),
    message: z.string().trim().min(2).max(5000).optional(),
    channels: z.array(channelSchema).min(1).max(3).optional(),
  }),
};

export const sendCrisisAlertSchema = {
  body: z.object({
    clientId: z.string().uuid("Invalid client id"),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    summary: z.string().trim().min(10).max(5000),
    source: z.string().trim().min(2).max(100).default("manual"),
  }),
};
