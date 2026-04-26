import { z } from "zod";

const isoDate = z
  .string()
  .datetime({ message: "Must be a valid ISO datetime" })
  .transform((s) => new Date(s));

export const createSlotsSchema = {
  body: z.object({
    slots: z
      .array(
        z.object({
          startTime: isoDate,
          endTime: isoDate,
        }),
      )
      .min(1, "At least one slot is required")
      .max(50, "Cannot create more than 50 slots at once"),
  }),
};

export const updateSlotSchema = {
  body: z
    .object({
      startTime: isoDate.optional(),
      endTime: isoDate.optional(),
    })
    .refine((v) => v.startTime || v.endTime, {
      message: "At least one of startTime or endTime is required",
    }),
};

export const slotIdParamSchema = {
  params: z.object({
    slotId: z.string().uuid("Invalid slot id"),
  }),
};

export const listSlotsQuerySchema = {
  query: z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    onlyAvailable: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
  }),
};
