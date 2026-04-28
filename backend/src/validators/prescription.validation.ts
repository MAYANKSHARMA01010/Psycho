import { z } from "zod";

export const createPrescriptionSchema = {
  body: z.object({
    clientId: z.string().uuid("Invalid client id"),
    medications: z
      .union([z.record(z.string(), z.any()), z.array(z.any())])
      .refine((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return Object.keys(value).length > 0;
      }, "medications cannot be empty"),
    instructions: z.string().trim().min(10).max(5000),
  }),
};

export const prescriptionIdParamSchema = {
  params: z.object({
    prescriptionId: z.string().uuid("Invalid prescription id"),
  }),
};

export const sharePrescriptionSchema = {
  body: z.object({
    channels: z.array(z.enum(["PUSH", "EMAIL", "SMS"]))
      .min(1)
      .max(3)
      .default(["PUSH", "EMAIL"]),
    message: z.string().trim().min(5).max(1000).optional(),
  }),
};

export const prescriptionListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
