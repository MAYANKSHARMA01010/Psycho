import { Role } from "../constants/roles";
import { env } from "../config/env";
import {
  SubscriptionRepository,
  subscriptionRepository,
} from "../repositories/SubscriptionRepository";
import { ApiError } from "../utils/ApiError";

export interface SubscriptionPlan {
  name: string;
  price: number;
  durationDays: number;
  description: string;
}

const PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    name: "Basic",
    price: 999,
    durationDays: 30,
    description: "4 sessions / month + chat support",
  },
  premium: {
    name: "Premium",
    price: 2499,
    durationDays: 30,
    description: "Unlimited sessions + priority booking + 24/7 chat",
  },
  annual: {
    name: "Annual",
    price: 24999,
    durationDays: 365,
    description: "Premium benefits, billed annually with 2 months free",
  },
};

export class SubscriptionService {
  constructor(
    private readonly subs: SubscriptionRepository = subscriptionRepository,
  ) {}

  public listPlans() {
    return { plans: PLANS };
  }

  public async create(userId: string, userRole: string, planKey: string, autoRenew = true) {
    if (userRole !== Role.CLIENT) {
      throw ApiError.forbidden("Only clients can subscribe");
    }
    const plan = PLANS[planKey];
    if (!plan) throw ApiError.badRequest("Unknown subscription plan");

    const existing = await this.subs.findByClient(userId);
    if (existing && existing.status === "ACTIVE") {
      throw ApiError.conflict("You already have an active subscription");
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 86_400_000);

    const sub = await this.subs.insert({
      clientId: userId,
      planName: plan.name,
      price: plan.price,
      currency: env.STRIPE_CURRENCY.toUpperCase(),
      startDate,
      endDate,
      autoRenew,
    });

    return { subscription: sub.toResponse() };
  }

  public async renew(userId: string, planKey?: string) {
    const sub = await this.subs.findByClient(userId);
    if (!sub) throw ApiError.notFound("Subscription");
    const plan = planKey ? PLANS[planKey] : PLANS.premium;
    if (!plan) throw ApiError.badRequest("Unknown subscription plan");

    const newEnd = new Date(
      Math.max(sub.endDate.getTime(), Date.now()) + plan.durationDays * 86_400_000,
    );
    sub.renew(newEnd);
    sub.planName = plan.name;
    sub.price = plan.price;
    const saved = await this.subs.update(sub);
    return { subscription: saved.toResponse() };
  }

  public async cancel(userId: string) {
    const sub = await this.subs.findByClient(userId);
    if (!sub) throw ApiError.notFound("Subscription");
    sub.cancel();
    const saved = await this.subs.update(sub);
    return { subscription: saved.toResponse() };
  }

  public async getOwn(userId: string) {
    const sub = await this.subs.findByClient(userId);
    if (!sub) return { subscription: null };
    sub.expireIfDue();
    if (sub.status === "EXPIRED") {
      await this.subs.update(sub);
    }
    return { subscription: sub.toResponse() };
  }
}

export const subscriptionService = new SubscriptionService();
