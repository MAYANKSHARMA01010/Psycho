import { Role } from "../constants/roles";
import { Subscription, SUBSCRIPTION_PLANS } from "../entities/Subscription";
import {
  SubscriptionRepository,
  subscriptionRepository,
} from "../repositories/SubscriptionRepository";
import { ApiError } from "../utils/ApiError";

export class SubscriptionService {
  constructor(
    private readonly subscriptions: SubscriptionRepository = subscriptionRepository,
  ) {}

  // ── Create Subscription ───────────────────────────────────────────────
  public async create(userId: string, userRole: string, payload: {
    planName: string;
  }) {
    this.ensureRole(userRole, Role.CLIENT);

    // Validate plan exists
    const planKey = payload.planName.toUpperCase();
    const plan = SUBSCRIPTION_PLANS[planKey];
    if (!plan) {
      throw ApiError.badRequest(
        `Invalid plan. Available plans: ${Object.keys(SUBSCRIPTION_PLANS).join(", ")}`,
      );
    }

    // Check if client already has an active subscription
    const existing = await this.subscriptions.findByClientId(userId);
    if (existing && existing.isActive()) {
      throw ApiError.conflict("You already have an active subscription. Cancel or let it expire before subscribing to a new plan.");
    }

    // If an expired/cancelled subscription exists, delete it first (schema is 1:1 unique)
    if (existing) {
      await this.subscriptions.deleteByClientId(userId);
    }

    const subscription = Subscription.create({
      clientId: userId,
      planName: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
    });

    const saved = await this.subscriptions.create(subscription);
    return { subscription: saved.toResponse() };
  }

  // ── Renew Subscription ────────────────────────────────────────────────
  public async renew(userId: string, userRole: string, subscriptionId: string) {
    this.ensureRole(userRole, Role.CLIENT);

    const subscription = await this.getSubscriptionOrFail(subscriptionId);
    if (!subscription.isOwnedByClient(userId)) throw ApiError.forbidden();

    // Find the plan to get duration
    const planKey = Object.keys(SUBSCRIPTION_PLANS).find(
      (k) => SUBSCRIPTION_PLANS[k].name === subscription.planName,
    );
    const plan = planKey ? SUBSCRIPTION_PLANS[planKey] : null;
    const durationDays = plan?.durationDays ?? 30;

    subscription.renew(durationDays);
    const saved = await this.subscriptions.save(subscription);
    return { subscription: saved.toResponse() };
  }

  // ── Cancel Subscription ───────────────────────────────────────────────
  public async cancel(userId: string, userRole: string, subscriptionId: string) {
    this.ensureRole(userRole, Role.CLIENT);

    const subscription = await this.getSubscriptionOrFail(subscriptionId);
    if (!subscription.isOwnedByClient(userId)) throw ApiError.forbidden();

    subscription.cancel();
    const saved = await this.subscriptions.save(subscription);
    return { subscription: saved.toResponse() };
  }

  // ── Get My Subscription ───────────────────────────────────────────────
  public async getMySubscription(userId: string, userRole: string) {
    this.ensureRole(userRole, Role.CLIENT);

    const subscription = await this.subscriptions.findByClientId(userId);
    if (!subscription) {
      return { subscription: null, plans: SUBSCRIPTION_PLANS };
    }
    return { subscription: subscription.toResponse(), plans: SUBSCRIPTION_PLANS };
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private async getSubscriptionOrFail(id: string): Promise<Subscription> {
    const subscription = await this.subscriptions.findById(id);
    if (!subscription) throw ApiError.notFound("Subscription");
    return subscription;
  }

  private ensureRole(userRole: string, required: Role): void {
    if (userRole !== required) {
      throw ApiError.forbidden(`Only ${required.toLowerCase()}s can perform this action`);
    }
  }
}

export const subscriptionService = new SubscriptionService();
