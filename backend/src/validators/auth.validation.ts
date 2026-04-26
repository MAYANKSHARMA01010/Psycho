import { z } from "zod";
import { Role } from "../constants/roles";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const emailSchema = z.string().trim().toLowerCase().email("Invalid email address");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number")
  .optional();

const roleSchema = z.enum([Role.CLIENT, Role.THERAPIST, Role.ADMIN]);
const clientFacingRoleSchema = z.enum([Role.CLIENT, Role.THERAPIST]);

export const registerSchema = {
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: clientFacingRoleSchema,
    phone: phoneSchema,
  }),
};

export const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
    role: roleSchema,
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(10, "Refresh token is required"),
  }),
};

export const logoutSchema = {
  body: z.object({
    refreshToken: z.string().min(10).optional(),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(10, "Reset token is required"),
    newPassword: passwordSchema,
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  }),
};

export const sendEmailVerificationSchema = {
  body: z.object({
    email: emailSchema.optional(),
  }),
};

export const verifyEmailSchema = {
  body: z.object({
    token: z.string().min(10, "Verification token is required"),
  }),
};

export const completeOnboardingSchema = {
  body: z.object({
    fullName: nameSchema,
    careGoal: z.enum(["stress", "sleep", "relationships", "career", "other"]),
    sessionStyle: z.enum(["video", "chat", "mixed"]),
    reminderChannel: z.enum(["email", "whatsapp", "none"]),
  }),
};

export const googleStartSchema = {
  query: z.object({
    role: clientFacingRoleSchema,
  }),
};
