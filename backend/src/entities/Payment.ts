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
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  transactionId: string | null;
  gatewayResponse: unknown;
  invoiceUrl: string | null;
  invoicePublicId: string | null;
  refundedAmount: number;
  refundReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResponse {
  id: string;
  clientId: string;
  sessionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  invoiceUrl: string | null;
  refundedAmount: number;
  refundReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export class Payment {
  public readonly id: string;
  public readonly clientId: string;
  public readonly sessionId: string;
  public readonly amount: number;
  public currency: string;
  public status: PaymentStatus;
  public method: string;
  public stripePaymentIntentId: string | null;
  public stripeChargeId: string | null;
  public transactionId: string | null;
  public gatewayResponse: unknown;
  public invoiceUrl: string | null;
  public invoicePublicId: string | null;
  public refundedAmount: number;
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
    this.stripePaymentIntentId = props.stripePaymentIntentId;
    this.stripeChargeId = props.stripeChargeId;
    this.transactionId = props.transactionId;
    this.gatewayResponse = props.gatewayResponse;
    this.invoiceUrl = props.invoiceUrl;
    this.invoicePublicId = props.invoicePublicId;
    this.refundedAmount = props.refundedAmount;
    this.refundReason = props.refundReason;
    this.paidAt = props.paidAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static fromPersistence(record: any): Payment {
    return new Payment({
      id: record.id,
      clientId: record.clientId,
      sessionId: record.sessionId,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      method: record.method,
      stripePaymentIntentId: record.stripePaymentIntentId,
      stripeChargeId: record.stripeChargeId,
      transactionId: record.transactionId,
      gatewayResponse: record.gatewayResponse,
      invoiceUrl: record.invoiceUrl,
      invoicePublicId: record.invoicePublicId,
      refundedAmount: record.refundedAmount ?? 0,
      refundReason: record.refundReason,
      paidAt: record.paidAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public markPaid(stripeChargeId: string | null, gatewayResponse: unknown): void {
    if (this.status === "COMPLETED") return;
    this.status = "COMPLETED";
    this.stripeChargeId = stripeChargeId ?? this.stripeChargeId;
    this.gatewayResponse = gatewayResponse;
    this.paidAt = new Date();
    this.updatedAt = new Date();
  }

  public markFailed(reason: unknown): void {
    if (this.status === "COMPLETED") return;
    this.status = "FAILED";
    this.gatewayResponse = reason;
    this.updatedAt = new Date();
  }

  public refund(amount: number, reason: string): void {
    if (this.status !== "COMPLETED") {
      throw ApiError.badRequest("Only completed payments can be refunded");
    }
    if (amount <= 0) throw ApiError.badRequest("Refund amount must be positive");
    const remaining = this.amount - this.refundedAmount;
    if (amount > remaining) {
      throw ApiError.badRequest(`Refund exceeds remaining amount (${remaining})`);
    }
    this.refundedAmount += amount;
    this.refundReason = reason;
    if (this.refundedAmount >= this.amount) {
      this.status = "REFUNDED";
    }
    this.updatedAt = new Date();
  }

  public attachInvoice(url: string, publicId: string): void {
    this.invoiceUrl = url;
    this.invoicePublicId = publicId;
    this.updatedAt = new Date();
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
      invoiceUrl: this.invoiceUrl,
      refundedAmount: this.refundedAmount,
      refundReason: this.refundReason,
      paidAt: this.paidAt,
      createdAt: this.createdAt,
    };
  }

  public toPersistence() {
    return {
      id: this.id,
      clientId: this.clientId,
      sessionId: this.sessionId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      method: this.method,
      stripePaymentIntentId: this.stripePaymentIntentId,
      stripeChargeId: this.stripeChargeId,
      transactionId: this.transactionId,
      gatewayResponse: this.gatewayResponse,
      invoiceUrl: this.invoiceUrl,
      invoicePublicId: this.invoicePublicId,
      refundedAmount: this.refundedAmount,
      refundReason: this.refundReason,
      paidAt: this.paidAt,
    };
  }
}
