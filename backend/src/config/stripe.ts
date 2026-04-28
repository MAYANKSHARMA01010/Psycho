import Stripe from "stripe";
import { env } from "./env";
import { logger } from "../utils/logger";

export type StripeClient = InstanceType<typeof Stripe>;
export type StripeEvent = ReturnType<StripeClient["webhooks"]["constructEvent"]>;

export class StripeConfig {
  private static instance: StripeClient | null = null;

  public static getInstance(): StripeClient {
    if (!StripeConfig.instance) {
      if (!env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
      }
      StripeConfig.instance = new Stripe(env.STRIPE_SECRET_KEY, {
        typescript: true,
      });
      logger.info("Stripe client initialized");
    }
    return StripeConfig.instance;
  }

  public static isConfigured(): boolean {
    return Boolean(env.STRIPE_SECRET_KEY);
  }
}
