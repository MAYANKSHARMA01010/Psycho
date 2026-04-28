export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_SERVER_FRONTEND_URL || "http://localhost:3000"
      : process.env.NEXT_PUBLIC_LOCAL_FRONTEND_URL || "http://localhost:3000",
  BACKEND_URL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_BACKEND_SERVER_URL || "http://localhost:5001"
      : process.env.NEXT_PUBLIC_BACKEND_LOCAL_URL || "http://localhost:5001",
};

export const getApiUrl = (endpoint: string) => {
  const base = config.BACKEND_URL.endsWith("/")
    ? config.BACKEND_URL.slice(0, -1)
    : config.BACKEND_URL;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};
