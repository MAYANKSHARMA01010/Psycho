import { DatabaseService } from "../config/database";
import { Subscription } from "../entities/Subscription";

export class SubscriptionRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(subscription: Subscription): Promise<Subscription> {
    const db = await this.db();
    const record = await db.subscription.create({
      data: {
        id: subscription.id,
        clientId: subscription.clientId,
        planName: subscription.planName,
        price: subscription.price,
        currency: subscription.currency,
        status: subscription.status as any,
        autoRenew: subscription.autoRenew,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
    return Subscription.fromPersistence(record);
  }

  public async findById(id: string): Promise<Subscription | null> {
    const db = await this.db();
    const record = await db.subscription.findUnique({ where: { id } });
    return record ? Subscription.fromPersistence(record) : null;
  }

  public async findByClientId(clientId: string): Promise<Subscription | null> {
    const db = await this.db();
    const record = await db.subscription.findUnique({ where: { clientId } });
    return record ? Subscription.fromPersistence(record) : null;
  }

  public async save(subscription: Subscription): Promise<Subscription> {
    const db = await this.db();
    const record = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planName: subscription.planName,
        price: subscription.price,
        status: subscription.status as any,
        autoRenew: subscription.autoRenew,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        updatedAt: new Date(),
      },
    });
    return Subscription.fromPersistence(record);
  }

  public async deleteByClientId(clientId: string): Promise<void> {
    const db = await this.db();
    await db.subscription.deleteMany({ where: { clientId } });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
