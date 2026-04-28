import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { Payment } from "../entities/Payment";

export interface CreatePaymentInput {
  clientId: string;
  sessionId: string;
  amount: number;
  currency: string;
  method: string;
  stripePaymentIntentId: string;
}

export interface ListPaymentOptions {
  page: number;
  limit: number;
  clientId?: string;
  sessionId?: string;
  status?: string;
}

export class PaymentRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findById(id: string): Promise<Payment | null> {
    const db = await this.db();
    const record = await db.payment.findUnique({ where: { id } });
    return record ? Payment.fromPersistence(record) : null;
  }

  public async findByStripePaymentIntent(intentId: string): Promise<Payment | null> {
    const db = await this.db();
    const record = await db.payment.findUnique({ where: { stripePaymentIntentId: intentId } });
    return record ? Payment.fromPersistence(record) : null;
  }

  public async findBySession(sessionId: string): Promise<Payment | null> {
    const db = await this.db();
    const record = await db.payment.findUnique({ where: { sessionId } });
    return record ? Payment.fromPersistence(record) : null;
  }

  public async insert(input: CreatePaymentInput): Promise<Payment> {
    const db = await this.db();
    const record = await db.payment.create({
      data: {
        id: randomUUID(),
        clientId: input.clientId,
        sessionId: input.sessionId,
        amount: input.amount,
        currency: input.currency,
        status: "PENDING",
        method: input.method,
        stripePaymentIntentId: input.stripePaymentIntentId,
        refundedAmount: 0,
      },
    });
    return Payment.fromPersistence(record);
  }

  public async update(payment: Payment): Promise<Payment> {
    const db = await this.db();
    const data = payment.toPersistence();
    const record = await db.payment.update({
      where: { id: data.id },
      data: {
        status: data.status,
        method: data.method,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeChargeId: data.stripeChargeId,
        transactionId: data.transactionId,
        gatewayResponse: data.gatewayResponse as any,
        invoiceUrl: data.invoiceUrl,
        invoicePublicId: data.invoicePublicId,
        refundedAmount: data.refundedAmount,
        refundReason: data.refundReason,
        paidAt: data.paidAt,
      },
    });
    return Payment.fromPersistence(record);
  }

  public async list(opts: ListPaymentOptions) {
    const db = await this.db();
    const where: Prisma.PaymentWhereInput = {};
    if (opts.clientId) where.clientId = opts.clientId;
    if (opts.sessionId) where.sessionId = opts.sessionId;
    if (opts.status) where.status = opts.status as any;

    const [records, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      db.payment.count({ where }),
    ]);

    return {
      items: records.map(Payment.fromPersistence),
      total,
      page: opts.page,
      limit: opts.limit,
      totalPages: Math.ceil(total / opts.limit) || 1,
    };
  }

  public async sumCompletedRevenue(): Promise<number> {
    const db = await this.db();
    const result = await db.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true, refundedAmount: true },
    });
    const gross = result._sum.amount ?? 0;
    const refunds = result._sum.refundedAmount ?? 0;
    return gross - refunds;
  }
}

export const paymentRepository = new PaymentRepository();
