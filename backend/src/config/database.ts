import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";
import { logger } from "../utils/logger";

export class DatabaseService {
  private static instance: PrismaClient;

  private constructor() {}

  public static async getInstance(): Promise<PrismaClient> {
    if (!this.instance) {
      this.instance = new PrismaClient({
        adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
        log: env.NODE_ENV === "development" ? (["query", "error", "warn"] as any) : (["error"] as any),
      });

      try {
        await this.instance.$connect();
        logger.info("Database connection established successfully");
      } catch (error) {
        logger.error("Failed to connect to database:", error);
        throw error;
      }
    }
    return this.instance;
  }

  public static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      logger.info("Database connection closed");
    }
  }
}

// Export a getter for convenience if needed, matching previous usage pattern but driven by class
export const db = DatabaseService; 
