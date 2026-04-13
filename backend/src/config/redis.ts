import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export class RedisService {
  private static instance: Redis;
  private static didLogUnavailable = false;

  private constructor() {}

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          if (times > 3) {
            return null;
          }

          const delay = Math.min(times * 200, 1000);
          return delay;
        },
      });

      this.instance.on("connect", () => {
        this.didLogUnavailable = false;
        logger.info("Connected to Redis");
      });

      this.instance.on("error", (error) => {
        if (!this.didLogUnavailable) {
          this.didLogUnavailable = true;
          logger.warn("Redis is unavailable. Continuing without Redis in development.", {
            code: (error as any)?.code,
          });
        }
      });

      this.instance.on("end", () => {
        if (env.NODE_ENV === "development") {
          logger.warn("Redis reconnect attempts stopped.");
        }
      });
    }
    return this.instance;
  }

  public static async disconnect(): Promise<void> {
    if (this.instance) {
      this.instance.disconnect();
      logger.info("Redis disconnected");
    }
  }
}
