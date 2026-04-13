import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export class RedisService {
  private static instance: Redis;

  private constructor() {}

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.instance.on("connect", () => {
        logger.info("Connected to Redis");
      });

      this.instance.on("error", (error) => {
        logger.error("Redis connection error:", error);
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
