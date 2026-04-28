import { StripeConfig, StripeEvent } from "../config/stripe";
import { env } from "../config/env";
import { Role } from "../constants/roles";
import { DatabaseService } from "../config/database";
import {
  PaymentRepository,
  paymentRepository,
} from "../repositories/PaymentRepository";
import { Payment } from "../entities/Payment";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { InvoiceService, invoiceService } from "./invoice.service";

export interface InitiatePaymentInput {
  sessionId: string;
  amount: number;
  method?: string;
}

export interface RefundInput {
  amount?: number;
  reason: string;
}

export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository = paymentRepository,
    private readonly invoices: InvoiceService = invoiceService,
  ) {}

  public async initiate(userId: string, userRole: string, input: InitiatePaymentInput) {
    if (userRole !== Role.CLIENT) {
      throw ApiError.forbidden("Only clients can initiate payments");
    }
    if (input.amount <= 0) throw ApiError.badRequest("Amount must be positive");

    const db = await DatabaseService.getInstance();
    const session = await db.session.findUnique({
      where: { id: input.sessionId },
      include: { client: true, therapist: { include: { user: true } } },
    });
    if (!session) throw ApiError.notFound("Session");
    if (session.clientId !== userId) {
      throw ApiError.forbidden("This session does not belong to you");
    }

    const existing = await this.payments.findBySession(input.sessionId);
    if (existing && existing.status === "COMPLETED") {
      throw ApiError.conflict("Session is already paid");
    }

    const stripe = StripeConfig.getInstance();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: env.STRIPE_CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        sessionId: input.sessionId,
        clientId: userId,
        therapistId: session.therapistId,
      },
    });

    const payment = existing
      ? await this.refreshIntentOnExisting(existing, intent.id)
      : await this.payments.insert({
          clientId: userId,
          sessionId: input.sessionId,
          amount: input.amount,
          currency: env.STRIPE_CURRENCY.toUpperCase(),
          method: input.method ?? "card",
          stripePaymentIntentId: intent.id,
        });

    return {
      payment: payment.toResponse(),
      clientSecret: intent.client_secret,
    };
  }

  public async refund(userId: string, userRole: string, paymentId: string, input: RefundInput) {
    if (userRole !== Role.ADMIN) {
      const payment = await this.payments.findById(paymentId);
      if (!payment || payment.clientId !== userId) {
        throw ApiError.forbidden("You cannot refund this payment");
      }
    }

    const payment = await this.payments.findById(paymentId);
    if (!payment) throw ApiError.notFound("Payment");
    if (!payment.stripePaymentIntentId) {
      throw ApiError.badRequest("Payment has no associated Stripe charge");
    }

    const refundAmount = input.amount ?? payment.amount - payment.refundedAmount;
    payment.refund(refundAmount, input.reason);

    const stripe = StripeConfig.getInstance();
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100),
      reason: "requested_by_customer",
      metadata: { reason: input.reason },
    });

    payment.gatewayResponse = { ...(payment.gatewayResponse as object | null), refund };
    const saved = await this.payments.update(payment);
    return { payment: saved.toResponse(), refund: { id: refund.id, status: refund.status } };
  }

  public async getById(userId: string, userRole: string, paymentId: string) {
    const payment = await this.payments.findById(paymentId);
    if (!payment) throw ApiError.notFound("Payment");
    if (userRole !== Role.ADMIN && payment.clientId !== userId) {
      throw ApiError.forbidden("You cannot view this payment");
    }
    return { payment: payment.toResponse() };
  }

  public async listOwn(
    userId: string,
    pagination: { page: number; limit: number; status?: string },
  ) {
    const result = await this.payments.list({
      clientId: userId,
      page: pagination.page,
      limit: pagination.limit,
      status: pagination.status,
    });
    return {
      items: result.items.map((p) => p.toResponse()),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async handleWebhookEvent(event: StripeEvent): Promise<void> {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as any;
        await this.handleIntentSucceeded(intent);
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as any;
        await this.handleIntentFailed(intent);
        break;
      }
      default:
        logger.info(`[stripe] unhandled event ${event.type}`);
    }
  }

  private async handleIntentSucceeded(intent: any): Promise<void> {
    const payment = await this.payments.findByStripePaymentIntent(intent.id);
    if (!payment) {
      logger.warn(`[stripe] succeeded intent ${intent.id} has no matching Payment row`);
      return;
    }

    const charge =
      typeof intent.latest_charge === "string"
        ? intent.latest_charge
        : (intent.latest_charge?.id ?? null);

    payment.markPaid(charge, { intentId: intent.id, amountReceived: intent.amount_received });
    await this.payments.update(payment);
    await this.attachInvoice(payment);

    // Best-effort: write Earning row + mark slot booked already happens at session lifecycle.
    await this.recordEarning(payment).catch((err) => {
      logger.error("[stripe] failed to record earning after success", err);
    });
  }

  private async handleIntentFailed(intent: any): Promise<void> {
    const payment = await this.payments.findByStripePaymentIntent(intent.id);
    if (!payment) return;
    payment.markFailed(intent.last_payment_error ?? null);
    await this.payments.update(payment);
  }

  private async attachInvoice(payment: Payment): Promise<void> {
    try {
      const db = await DatabaseService.getInstance();
      const session = await db.session.findUnique({
        where: { id: payment.sessionId },
        include: { client: { include: { user: true } }, therapist: { include: { user: true } } },
      });
      if (!session) return;

      const { url, publicId } = await this.invoices.generateAndStore({
        payment,
        client: { name: session.client.user.name, email: session.client.user.email },
        therapist: { name: session.therapist.user.name },
        session: {
          id: session.id,
          scheduledAt: session.scheduledAt,
          type: session.type,
        },
      });

      payment.attachInvoice(url, publicId);
      await this.payments.update(payment);
    } catch (error) {
      logger.error("[invoice] failed to generate", error as any);
    }
  }

  private async recordEarning(payment: Payment): Promise<void> {
    const db = await DatabaseService.getInstance();
    const session = await db.session.findUnique({
      where: { id: payment.sessionId },
      select: { therapistId: true },
    });
    if (!session) return;

    const commissionRate = env.PLATFORM_COMMISSION_PERCENT / 100;
    const platformCommission = +(payment.amount * commissionRate).toFixed(2);
    const netAmount = +(payment.amount - platformCommission).toFixed(2);

    await db.earning.upsert({
      where: { sessionId: payment.sessionId },
      update: { amount: payment.amount, platformCommission, netAmount },
      create: {
        therapistId: session.therapistId,
        sessionId: payment.sessionId,
        amount: payment.amount,
        platformCommission,
        netAmount,
      },
    });
  }

  private async refreshIntentOnExisting(payment: Payment, newIntentId: string): Promise<Payment> {
    payment.stripePaymentIntentId = newIntentId;
    payment.status = "PENDING";
    payment.updatedAt = new Date();
    return this.payments.update(payment);
  }
}

export const paymentService = new PaymentService();
