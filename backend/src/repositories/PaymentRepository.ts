import { DatabaseService } from "../config/database";
import { Payment } from "../entities/Payment";

export interface ListPaymentsOptions {
  status?: string;
  page?: number;
  limit?: number;
}

export class PaymentRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(payment: Payment): Promise<Payment> {
    const db = await this.db();
    const record = await db.payment.create({
      data: {
        id: payment.id,
        clientId: payment.clientId,
        sessionId: payment.sessionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status as any,
        method: payment.method,
        transactionId: payment.transactionId,
        gatewayResponse: payment.gatewayResponse,
        refundReason: payment.refundReason,
        paidAt: payment.paidAt,
      },
    });
    return Payment.fromPersistence(record);
  }

  public async findById(id: string): Promise<Payment | null> {
    const db = await this.db();
    const record = await db.payment.findUnique({ where: { id } });
    return record ? Payment.fromPersistence(record) : null;
  }

  public async findBySessionId(sessionId: string): Promise<Payment | null> {
    const db = await this.db();
    const record = await db.payment.findUnique({ where: { sessionId } });
    return record ? Payment.fromPersistence(record) : null;
  }

  public async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const db = await this.db();
    const record = await db.payment.findUnique({ where: { transactionId } });
    return record ? Payment.fromPersistence(record) : null;
  }

  public async save(payment: Payment): Promise<Payment> {
    const db = await this.db();
    const record = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: payment.status as any,
        transactionId: payment.transactionId,
        gatewayResponse: payment.gatewayResponse,
        refundReason: payment.refundReason,
        paidAt: payment.paidAt,
        updatedAt: new Date(),
      },
    });
    return Payment.fromPersistence(record);
  }

  public async listForClient(
    clientId: string,
    opts: ListPaymentsOptions = {},
  ): Promise<{ payments: Payment[]; total: number }> {
    const db = await this.db();
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, opts.limit ?? 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { clientId };
    if (opts.status) filter.status = opts.status;

    const [records, total] = await Promise.all([
      db.payment.findMany({
        where: filter,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.payment.count({ where: filter }),
    ]);

    return { payments: records.map((r: any) => Payment.fromPersistence(r)), total };
  }

  /**
   * Fetch a payment with its related session data for invoice generation.
   */
  public async findByIdWithSession(id: string): Promise<any | null> {
    const db = await this.db();
    return db.payment.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            therapist: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        client: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
