import { randomUUID } from "node:crypto";
import { DatabaseService } from "../config/database";
import { Subscription, SubscriptionStatus } from "../entities/Subscription";

export interface CreateSubscriptionInput {
  clientId: string;
  planName: string;
  price: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export class SubscriptionRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findByClient(clientId: string): Promise<Subscription | null> {
    const db = await this.db();
    const record = await db.subscription.findUnique({ where: { clientId } });
    return record ? Subscription.fromPersistence(record) : null;
  }

  public async insert(input: CreateSubscriptionInput): Promise<Subscription> {
    const db = await this.db();
    const record = await db.subscription.create({
      data: {
        id: randomUUID(),
        clientId: input.clientId,
        planName: input.planName,
        price: input.price,
        currency: input.currency,
        status: "ACTIVE",
        autoRenew: input.autoRenew,
        startDate: input.startDate,
        endDate: input.endDate,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      },
    });
    return Subscription.fromPersistence(record);
  }

  public async update(sub: Subscription): Promise<Subscription> {
    const db = await this.db();
    const record = await db.subscription.update({
      where: { id: sub.id },
      data: {
        planName: sub.planName,
        price: sub.price,
        currency: sub.currency,
        status: sub.status as SubscriptionStatus,
        autoRenew: sub.autoRenew,
        startDate: sub.startDate,
        endDate: sub.endDate,
        stripeCustomerId: sub.stripeCustomerId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        cancelledAt: sub.cancelledAt,
      },
    });
    return Subscription.fromPersistence(record);
  }
}

export const subscriptionRepository = new SubscriptionRepository();
