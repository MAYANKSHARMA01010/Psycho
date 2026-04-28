import { ApiError } from "../utils/ApiError";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface SubscriptionProps {
  id: string;
  clientId: string;
  planName: string;
  price: number;
  currency: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  startDate: Date;
  endDate: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionResponse {
  id: string;
  clientId: string;
  planName: string;
  price: number;
  currency: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  startDate: Date;
  endDate: Date;
  cancelledAt: Date | null;
}

export class Subscription {
  public readonly id: string;
  public readonly clientId: string;
  public planName: string;
  public price: number;
  public currency: string;
  public status: SubscriptionStatus;
  public autoRenew: boolean;
  public startDate: Date;
  public endDate: Date;
  public stripeCustomerId: string | null;
  public stripeSubscriptionId: string | null;
  public cancelledAt: Date | null;
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
    this.stripeCustomerId = props.stripeCustomerId;
    this.stripeSubscriptionId = props.stripeSubscriptionId;
    this.cancelledAt = props.cancelledAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static fromPersistence(record: any): Subscription {
    return new Subscription({
      id: record.id,
      clientId: record.clientId,
      planName: record.planName,
      price: record.price,
      currency: record.currency,
      status: record.status,
      autoRenew: record.autoRenew,
      startDate: record.startDate,
      endDate: record.endDate,
      stripeCustomerId: record.stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      cancelledAt: record.cancelledAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public renew(newEndDate: Date): void {
    if (this.status === "CANCELLED") {
      throw ApiError.conflict("Cancelled subscription cannot be renewed");
    }
    if (newEndDate.getTime() <= this.endDate.getTime()) {
      throw ApiError.badRequest("New end date must be after current end date");
    }
    this.endDate = newEndDate;
    this.status = "ACTIVE";
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.status === "CANCELLED") {
      throw ApiError.conflict("Subscription already cancelled");
    }
    this.status = "CANCELLED";
    this.autoRenew = false;
    this.cancelledAt = new Date();
    this.updatedAt = new Date();
  }

  public expireIfDue(): void {
    if (this.status === "ACTIVE" && this.endDate.getTime() < Date.now()) {
      this.status = "EXPIRED";
      this.updatedAt = new Date();
    }
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
      cancelledAt: this.cancelledAt,
    };
  }
}
