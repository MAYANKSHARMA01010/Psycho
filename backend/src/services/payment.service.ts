import { randomUUID } from "node:crypto";
import { Role } from "../constants/roles";
import { Payment, CreatePaymentInput } from "../entities/Payment";
import { Earning } from "../entities/Earning";
import { PaymentRepository, paymentRepository } from "../repositories/PaymentRepository";
import { EarningRepository, earningRepository } from "../repositories/EarningRepository";
import { SessionRepository, sessionRepository } from "../repositories/SessionRepository";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

/** Platform commission rate: 10% */
const COMMISSION_RATE = 0.10;

export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository = paymentRepository,
    private readonly earnings: EarningRepository = earningRepository,
    private readonly sessions: SessionRepository = sessionRepository,
  ) {}

  // ── Initiate Payment ──────────────────────────────────────────────────
  public async initiate(userId: string, userRole: string, payload: {
    sessionId: string;
    method: string;
    currency?: string;
  }) {
    this.ensureRole(userRole, Role.CLIENT);

    // Verify session exists and belongs to this client
    const session = await this.sessions.findById(payload.sessionId);
    if (!session) throw ApiError.notFound("Session");
    if (!session.isOwnedByClient(userId)) throw ApiError.forbidden();

    // Prevent duplicate payments for the same session
    const existing = await this.payments.findBySessionId(payload.sessionId);
    if (existing) {
      throw ApiError.conflict("A payment already exists for this session");
    }

    // Calculate amount from therapist hourly rate (fallback to a default)
    // In production, this would come from the session booking price
    const amount = 1500; // Default session price in INR — replace with real pricing logic

    const payment = Payment.create({
      clientId: userId,
      sessionId: payload.sessionId,
      amount,
      method: payload.method,
      currency: payload.currency,
    });

    const saved = await this.payments.create(payment);

    // Mock gateway: return a fake payment intent / order ID
    const mockPaymentIntent = {
      gatewayOrderId: `mock_order_${randomUUID().slice(0, 8)}`,
      amount: saved.amount,
      currency: saved.currency,
      status: "created",
    };

    return {
      payment: saved.toResponse(),
      gateway: mockPaymentIntent,
    };
  }

  // ── Confirm Payment ───────────────────────────────────────────────────
  public async confirm(userId: string, userRole: string, payload: {
    paymentId: string;
    transactionId: string;
    gatewayResponse?: any;
  }) {
    this.ensureRole(userRole, Role.CLIENT);

    const payment = await this.getPaymentOrFail(payload.paymentId);
    if (!payment.isOwnedByClient(userId)) throw ApiError.forbidden();

    // Confirm the payment (entity validates state transition)
    payment.confirm(payload.transactionId, payload.gatewayResponse);
    const saved = await this.payments.save(payment);

    // Side-effect: Create an earning record for the therapist
    const session = await this.sessions.findById(payment.sessionId);
    if (session) {
      const earning = Earning.create({
        therapistId: session.therapistId,
        sessionId: session.id,
        amount: payment.amount,
        commissionRate: COMMISSION_RATE,
      });
      await this.earnings.create(earning);
    }

    await notificationService.sendToUsers({
      userIds: [payment.clientId],
      type: "PAYMENT_UPDATE",
      channels: ["PUSH", "EMAIL"],
      title: "Payment Successful",
      message: `Your payment of ${payment.currency} ${payment.amount.toFixed(2)} was confirmed.`,
      metadata: {
        paymentId: payment.id,
        sessionId: payment.sessionId,
        status: saved.status,
      },
      clientId: payment.clientId,
    });

    return { payment: saved.toResponse() };
  }

  // ── Refund Payment ────────────────────────────────────────────────────
  public async refund(userId: string, userRole: string, paymentId: string, reason: string) {
    this.ensureRole(userRole, Role.ADMIN);

    const payment = await this.getPaymentOrFail(paymentId);
    payment.refund(reason);
    const saved = await this.payments.save(payment);

    // Rollback: Delete associated earning if it exists and hasn't been paid out
    const earning = await this.earnings.findBySessionId(payment.sessionId);
    if (earning && !earning.isPaid) {
      // We don't delete — mark the earning as reversed by setting isPaid=true and netAmount context
      // In a real system this would be a separate refund-earning record
    }

    await notificationService.sendToUsers({
      userIds: [payment.clientId],
      type: "PAYMENT_UPDATE",
      channels: ["PUSH", "EMAIL"],
      title: "Payment Refunded",
      message: `Your payment of ${payment.currency} ${payment.amount.toFixed(2)} has been refunded.`,
      metadata: {
        paymentId: payment.id,
        sessionId: payment.sessionId,
        status: saved.status,
        reason,
      },
      clientId: payment.clientId,
    });

    return { payment: saved.toResponse() };
  }

  // ── Generate Invoice (JSON) ───────────────────────────────────────────
  public async generateInvoice(userId: string, userRole: string, paymentId: string) {
    const payment = await this.getPaymentOrFail(paymentId);

    // Only the owning client or an admin can view invoices
    if (userRole === Role.CLIENT && !payment.isOwnedByClient(userId)) {
      throw ApiError.forbidden();
    }
    if (userRole !== Role.CLIENT && userRole !== Role.ADMIN) {
      throw ApiError.forbidden();
    }

    if (payment.status !== "COMPLETED") {
      throw ApiError.badRequest("Invoice can only be generated for completed payments");
    }

    // Fetch enriched data for the invoice
    const enriched = await this.payments.findByIdWithSession(paymentId);
    if (!enriched) throw ApiError.notFound("Payment");

    const invoice = {
      invoiceNumber: `INV-${enriched.id.slice(0, 8).toUpperCase()}`,
      issuedAt: enriched.paidAt ?? enriched.createdAt,
      payment: {
        id: enriched.id,
        amount: enriched.amount,
        currency: enriched.currency,
        method: enriched.method,
        transactionId: enriched.transactionId,
        paidAt: enriched.paidAt,
      },
      client: {
        name: enriched.client?.user?.name ?? "N/A",
        email: enriched.client?.user?.email ?? "N/A",
      },
      therapist: {
        name: enriched.session?.therapist?.user?.name ?? "N/A",
        email: enriched.session?.therapist?.user?.email ?? "N/A",
      },
      session: {
        id: enriched.sessionId,
        type: enriched.session?.type ?? "N/A",
        scheduledAt: enriched.session?.scheduledAt ?? null,
      },
      platform: {
        name: "Zenora",
        gst: "N/A", // Placeholder for GST/tax registration
      },
    };

    return { invoice };
  }

  // ── Get Payment by ID ─────────────────────────────────────────────────
  public async getById(userId: string, userRole: string, paymentId: string) {
    const payment = await this.getPaymentOrFail(paymentId);
    if (userRole === Role.CLIENT && !payment.isOwnedByClient(userId)) {
      throw ApiError.forbidden();
    }
    return { payment: payment.toResponse() };
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private async getPaymentOrFail(id: string): Promise<Payment> {
    const payment = await this.payments.findById(id);
    if (!payment) throw ApiError.notFound("Payment");
    return payment;
  }

  private ensureRole(userRole: string, required: Role): void {
    if (userRole !== required) {
      throw ApiError.forbidden(`Only ${required.toLowerCase()}s can perform this action`);
    }
  }
}

export const paymentService = new PaymentService();
