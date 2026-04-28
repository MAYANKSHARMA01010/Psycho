import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVER_PORT: z.preprocess((val) => Number(val), z.number()).default(5000),

  FRONTEND_LOCAL_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_SERVER_URL: z.string().url().optional().or(z.literal("")),

  BACKEND_LOCAL_URL: z.string().url().default("http://localhost:5001"),
  BACKEND_SERVER_URL: z.string().url().optional().or(z.literal("")),

  REDIS_LOCAL_URL: z.string().url().default("redis://localhost:6379"),
  REDIS_SERVER_URL: z.string().url().optional().or(z.literal("")),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI_LOCAL: z.string().url().optional(),
  GOOGLE_REDIRECT_URI_SERVER: z.string().url().optional(),

  DATABASE_URL: z.string().url(),

  JWT_SESSION_SECRET: z.string().min(32),
  JWT_SESSION_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  BCRYPT_SALT_ROUNDS: z.preprocess((val) => Number(val), z.number().int()).default(12),
  
  RATE_LIMIT_WINDOW_MS: z.preprocess((val) => Number(val), z.number().int()).default(900000),
  RATE_LIMIT_MAX: z.preprocess((val) => Number(val), z.number().int()).default(100),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

const env = _env.data;

/**
 * Combined configuration object that automatically selects the correct URL
 * based on the current NODE_ENV (development vs production).
 */
export const config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.SERVER_PORT,

  // URLs (automatically switch between Local and Server based on NODE_ENV)
  CLIENT_URL: env.NODE_ENV === "production"
    ? (env.FRONTEND_SERVER_URL || env.FRONTEND_LOCAL_URL)
    : env.FRONTEND_LOCAL_URL,
    
  BACKEND_URL: env.NODE_ENV === "production"
    ? (env.BACKEND_SERVER_URL || env.BACKEND_LOCAL_URL)
    : env.BACKEND_LOCAL_URL,
    
  REDIS_URL: env.NODE_ENV === "production"
    ? (env.REDIS_SERVER_URL || env.REDIS_LOCAL_URL)
    : env.REDIS_LOCAL_URL,
    
  GOOGLE_REDIRECT_URI: env.NODE_ENV === "production"
    ? (env.GOOGLE_REDIRECT_URI_SERVER || env.GOOGLE_REDIRECT_URI_LOCAL)
    : env.GOOGLE_REDIRECT_URI_LOCAL,

  // Auth & Security
  JWT: {
    SECRET: env.JWT_SESSION_SECRET,
    EXPIRES_IN: env.JWT_SESSION_EXPIRES_IN,
    REFRESH_SECRET: env.JWT_REFRESH_SECRET,
    REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  BCRYPT_SALT_ROUNDS: env.BCRYPT_SALT_ROUNDS,
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
    MAX: env.RATE_LIMIT_MAX,
  },

  // Third Party
  GOOGLE: {
    CLIENT_ID: env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  },

  DATABASE_URL: env.DATABASE_URL,
};

// Also export raw env for cases where it's specifically needed
export { env };
