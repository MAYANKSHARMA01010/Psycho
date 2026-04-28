import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  NEXT_PUBLIC_LOCAL_FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SERVER_FRONTEND_URL: z.string().url().optional(),
  
  NEXT_PUBLIC_BACKEND_LOCAL_URL: z.string().url().default("http://localhost:5001"),
  NEXT_PUBLIC_BACKEND_SERVER_URL: z.string().url().optional(),
});

// Since process.env is not a plain object in Next.js browser env, 
// we manually pick the variables we need.
const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_LOCAL_FRONTEND_URL: process.env.NEXT_PUBLIC_LOCAL_FRONTEND_URL,
  NEXT_PUBLIC_SERVER_FRONTEND_URL: process.env.NEXT_PUBLIC_SERVER_FRONTEND_URL,
  NEXT_PUBLIC_BACKEND_LOCAL_URL: process.env.NEXT_PUBLIC_BACKEND_LOCAL_URL,
  NEXT_PUBLIC_BACKEND_SERVER_URL: process.env.NEXT_PUBLIC_BACKEND_SERVER_URL,
});

if (!parsed.success) {
  console.error("❌ Invalid frontend environment variables:", parsed.error.format());
  // In production, we might not want to throw, but in development, it's helpful.
  if (process.env.NODE_ENV === "development") {
    throw new Error("Invalid environment variables");
  }
}

export const env = parsed.data || {
  NODE_ENV: "development",
  NEXT_PUBLIC_LOCAL_FRONTEND_URL: "http://localhost:3000",
  NEXT_PUBLIC_BACKEND_LOCAL_URL: "http://localhost:5001",
};
