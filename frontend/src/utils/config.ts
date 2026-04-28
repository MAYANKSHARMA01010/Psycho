import { env } from "@/config/env";

export const config = {
  NODE_ENV: env.NODE_ENV,
  FRONTEND_URL:
    env.NODE_ENV === "production"
      ? env.NEXT_PUBLIC_SERVER_FRONTEND_URL || env.NEXT_PUBLIC_LOCAL_FRONTEND_URL
      : env.NEXT_PUBLIC_LOCAL_FRONTEND_URL,
  BACKEND_URL:
    env.NODE_ENV === "production"
      ? env.NEXT_PUBLIC_BACKEND_SERVER_URL || env.NEXT_PUBLIC_BACKEND_LOCAL_URL
      : env.NEXT_PUBLIC_BACKEND_LOCAL_URL,
};

export const getApiUrl = (endpoint: string) => {
  const base = config.BACKEND_URL.endsWith("/")
    ? config.BACKEND_URL.slice(0, -1)
    : config.BACKEND_URL;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};
