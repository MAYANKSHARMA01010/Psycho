import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface PaymentProps {
  id: string;
  clientId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  transactionId: string | null;
  gatewayResponse: any | null;
  refundReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  clientId: string;
  sessionId: string;
  amount: number;
  method: string;
  currency?: string;
}

export interface PaymentResponse {
  id: string;
  clientId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  transactionId: string | null;
  refundReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  public readonly id: string;
  public readonly clientId: string;
  public readonly sessionId: string;
  public readonly amount: number;
  public readonly currency: string;
  public status: PaymentStatus;
  public readonly method: string;
  public transactionId: string | null;
  public gatewayResponse: any | null;
  public refundReason: string | null;
  public paidAt: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.sessionId = props.sessionId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.status = props.status;
    this.method = props.method;
    this.transactionId = props.transactionId;
    this.gatewayResponse = props.gatewayResponse;
    this.refundReason = props.refundReason;
    this.paidAt = props.paidAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(input: CreatePaymentInput): Payment {
    if (input.amount <= 0) {
      throw ApiError.badRequest("Payment amount must be greater than zero");
    }
    return new Payment({
      id: randomUUID(),
      clientId: input.clientId,
      sessionId: input.sessionId,
      amount: input.amount,
      currency: input.currency ?? "INR",
      status: "PENDING",
      method: input.method,
      transactionId: null,
      gatewayResponse: null,
      refundReason: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(record: any): Payment {
    return new Payment({
      id: record.id,
      clientId: record.clientId,
      sessionId: record.sessionId,
      amount: record.amount,
      currency: record.currency,
      status: record.status as PaymentStatus,
      method: record.method,
      transactionId: record.transactionId ?? null,
      gatewayResponse: record.gatewayResponse ?? null,
      refundReason: record.refundReason ?? null,
      paidAt: record.paidAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public confirm(transactionId: string, gatewayResponse?: any): void {
    if (this.status !== "PENDING") {
      throw ApiError.badRequest("Only pending payments can be confirmed");
    }
    this.status = "COMPLETED";
    this.transactionId = transactionId;
    this.gatewayResponse = gatewayResponse ?? null;
    this.paidAt = new Date();
    this.updatedAt = new Date();
  }

  public fail(gatewayResponse?: any): void {
    if (this.status !== "PENDING") {
      throw ApiError.badRequest("Only pending payments can be marked as failed");
    }
    this.status = "FAILED";
    this.gatewayResponse = gatewayResponse ?? null;
    this.updatedAt = new Date();
  }

  public refund(reason: string): void {
    if (this.status !== "COMPLETED") {
      throw ApiError.badRequest("Only completed payments can be refunded");
    }
    this.status = "REFUNDED";
    this.refundReason = reason;
    this.updatedAt = new Date();
  }

  public isPending(): boolean {
    return this.status === "PENDING";
  }

  public isCompleted(): boolean {
    return this.status === "COMPLETED";
  }

  public isOwnedByClient(clientId: string): boolean {
    return this.clientId === clientId;
  }

  public toResponse(): PaymentResponse {
    return {
      id: this.id,
      clientId: this.clientId,
      sessionId: this.sessionId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      method: this.method,
      transactionId: this.transactionId,
      refundReason: this.refundReason,
      paidAt: this.paidAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
