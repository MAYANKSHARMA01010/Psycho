import { DatabaseService } from "../config/database";
import { Earning } from "../entities/Earning";

export interface ListEarningsOptions {
  isPaid?: boolean;
  page?: number;
  limit?: number;
}

export class EarningRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(earning: Earning): Promise<Earning> {
    const db = await this.db();
    const record = await db.earning.create({
      data: {
        id: earning.id,
        therapistId: earning.therapistId,
        sessionId: earning.sessionId,
        amount: earning.amount,
        platformCommission: earning.platformCommission,
        netAmount: earning.netAmount,
        isPaid: earning.isPaid,
        paidAt: earning.paidAt,
        withdrawalId: earning.withdrawalId,
      },
    });
    return Earning.fromPersistence(record);
  }

  public async findById(id: string): Promise<Earning | null> {
    const db = await this.db();
    const record = await db.earning.findUnique({ where: { id } });
    return record ? Earning.fromPersistence(record) : null;
  }

  public async findBySessionId(sessionId: string): Promise<Earning | null> {
    const db = await this.db();
    const record = await db.earning.findUnique({ where: { sessionId } });
    return record ? Earning.fromPersistence(record) : null;
  }

  public async listForTherapist(
    therapistId: string,
    opts: ListEarningsOptions = {},
  ): Promise<{ earnings: Earning[]; total: number }> {
    const db = await this.db();
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, opts.limit ?? 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { therapistId };
    if (opts.isPaid !== undefined) filter.isPaid = opts.isPaid;

    const [records, total] = await Promise.all([
      db.earning.findMany({
        where: filter,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.earning.count({ where: filter }),
    ]);

    return { earnings: records.map((r: any) => Earning.fromPersistence(r)), total };
  }

  /**
   * Get the total unpaid (available) balance for a therapist.
   */
  public async getAvailableBalance(therapistId: string): Promise<number> {
    const db = await this.db();
    const result = await db.earning.aggregate({
      where: { therapistId, isPaid: false },
      _sum: { netAmount: true },
    });
    return result._sum.netAmount ?? 0;
  }

  /**
   * Get lifetime summary stats for a therapist's earnings.
   */
  public async getSummary(therapistId: string): Promise<{
    totalEarned: number;
    totalCommission: number;
    totalNet: number;
    totalPaid: number;
    availableBalance: number;
  }> {
    const db = await this.db();
    const [all, paid, unpaid] = await Promise.all([
      db.earning.aggregate({
        where: { therapistId },
        _sum: { amount: true, platformCommission: true, netAmount: true },
      }),
      db.earning.aggregate({
        where: { therapistId, isPaid: true },
        _sum: { netAmount: true },
      }),
      db.earning.aggregate({
        where: { therapistId, isPaid: false },
        _sum: { netAmount: true },
      }),
    ]);
    return {
      totalEarned: all._sum.amount ?? 0,
      totalCommission: all._sum.platformCommission ?? 0,
      totalNet: all._sum.netAmount ?? 0,
      totalPaid: paid._sum.netAmount ?? 0,
      availableBalance: unpaid._sum.netAmount ?? 0,
    };
  }

  /**
   * Mark multiple unpaid earnings as paid and link them to a withdrawal request.
   */
  public async markEarningsAsPaid(therapistId: string, withdrawalId: string, amount: number): Promise<void> {
    const db = await this.db();
    // Fetch unpaid earnings oldest first until we cover the amount
    const earnings = await db.earning.findMany({
      where: { therapistId, isPaid: false },
      orderBy: { createdAt: "asc" },
    });

    let remaining = amount;
    const idsToUpdate: string[] = [];
    for (const e of earnings) {
      if (remaining <= 0) break;
      idsToUpdate.push(e.id);
      remaining -= e.netAmount;
    }

    if (idsToUpdate.length > 0) {
      await db.earning.updateMany({
        where: { id: { in: idsToUpdate } },
        data: { isPaid: true, paidAt: new Date(), withdrawalId },
      });
    }
  }
}

export const earningRepository = new EarningRepository();
