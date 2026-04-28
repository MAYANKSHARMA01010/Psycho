import { z } from "zod";

export const updateProfileSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
        .nullable()
        .optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "At least one field is required",
    }),
};
