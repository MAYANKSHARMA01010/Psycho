import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError";

export type SubscriptionStatusType = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface SubscriptionProps {
  id: string;
  clientId: string;
  planName: string;
  price: number;
  currency: string;
  status: SubscriptionStatusType;
  autoRenew: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  clientId: string;
  planName: string;
  price: number;
  durationDays: number;
  currency?: string;
}

export interface SubscriptionResponse {
  id: string;
  clientId: string;
  planName: string;
  price: number;
  currency: string;
  status: SubscriptionStatusType;
  autoRenew: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Predefined subscription plans
export const SUBSCRIPTION_PLANS: Record<string, { name: string; price: number; durationDays: number }> = {
  BASIC: { name: "Basic", price: 999, durationDays: 30 },
  STANDARD: { name: "Standard", price: 1999, durationDays: 30 },
  PREMIUM: { name: "Premium", price: 3999, durationDays: 30 },
};

export class Subscription {
  public readonly id: string;
  public readonly clientId: string;
  public planName: string;
  public price: number;
  public readonly currency: string;
  public status: SubscriptionStatusType;
  public autoRenew: boolean;
  public startDate: Date;
  public endDate: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.planName = props.planName;
    this.price = props.price;
    this.currency = props.currency;
    this.status = props.status;
    this.autoRenew = props.autoRenew;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(input: CreateSubscriptionInput): Subscription {
    if (input.price <= 0) {
      throw ApiError.badRequest("Subscription price must be greater than zero");
    }
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + input.durationDays);

    return new Subscription({
      id: randomUUID(),
      clientId: input.clientId,
      planName: input.planName,
      price: input.price,
      currency: input.currency ?? "INR",
      status: "ACTIVE",
      autoRenew: true,
      startDate: now,
      endDate,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(record: any): Subscription {
    return new Subscription({
      id: record.id,
      clientId: record.clientId,
      planName: record.planName,
      price: record.price,
      currency: record.currency,
      status: record.status as SubscriptionStatusType,
      autoRenew: record.autoRenew,
      startDate: record.startDate,
      endDate: record.endDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public renew(durationDays: number): void {
    if (this.status === "CANCELLED") {
      throw ApiError.badRequest("Cannot renew a cancelled subscription");
    }
    const now = new Date();
    // If still active, extend from current end date; otherwise from now
    const base = this.endDate > now ? this.endDate : now;
    this.startDate = this.endDate > now ? this.startDate : now;
    this.endDate = new Date(base);
    this.endDate.setDate(this.endDate.getDate() + durationDays);
    this.status = "ACTIVE";
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.status !== "ACTIVE") {
      throw ApiError.badRequest("Only active subscriptions can be cancelled");
    }
    this.status = "CANCELLED";
    this.autoRenew = false;
    this.updatedAt = new Date();
  }

  public isActive(): boolean {
    return this.status === "ACTIVE" && this.endDate > new Date();
  }

  public isExpired(): boolean {
    return this.endDate <= new Date();
  }

  public isOwnedByClient(clientId: string): boolean {
    return this.clientId === clientId;
  }

  public toResponse(): SubscriptionResponse {
    return {
      id: this.id,
      clientId: this.clientId,
      planName: this.planName,
      price: this.price,
      currency: this.currency,
      status: this.status,
      autoRenew: this.autoRenew,
      startDate: this.startDate,
      endDate: this.endDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
