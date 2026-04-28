import { Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";

export interface EarningRecord {
  id: string;
  therapistId: string;
  sessionId: string;
  amount: number;
  platformCommission: number;
  netAmount: number;
  isPaid: boolean;
  paidAt: Date | null;
  createdAt: Date;
}

export class EarningRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async listForTherapist(
    therapistId: string,
    pagination: { page: number; limit: number; isPaid?: boolean },
  ) {
    const db = await this.db();
    const where: Prisma.EarningWhereInput = { therapistId };
    if (pagination.isPaid !== undefined) where.isPaid = pagination.isPaid;
    const [items, total] = await Promise.all([
      db.earning.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      db.earning.count({ where }),
    ]);
    return {
      items: items as unknown as EarningRecord[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  public async summaryForTherapist(therapistId: string) {
    const db = await this.db();
    const [paid, unpaid] = await Promise.all([
      db.earning.aggregate({
        where: { therapistId, isPaid: true },
        _sum: { netAmount: true, platformCommission: true, amount: true },
      }),
      db.earning.aggregate({
        where: { therapistId, isPaid: false },
        _sum: { netAmount: true, platformCommission: true, amount: true },
      }),
    ]);
    return {
      paid: {
        gross: paid._sum.amount ?? 0,
        commission: paid._sum.platformCommission ?? 0,
        net: paid._sum.netAmount ?? 0,
      },
      pending: {
        gross: unpaid._sum.amount ?? 0,
        commission: unpaid._sum.platformCommission ?? 0,
        net: unpaid._sum.netAmount ?? 0,
      },
    };
  }

  public async availableBalance(therapistId: string): Promise<number> {
    const db = await this.db();
    const result = await db.earning.aggregate({
      where: { therapistId, isPaid: false },
      _sum: { netAmount: true },
    });
    return result._sum.netAmount ?? 0;
  }

  public async markPaid(therapistId: string, ids: string[]): Promise<void> {
    if (!ids.length) return;
    const db = await this.db();
    await db.earning.updateMany({
      where: { therapistId, id: { in: ids } },
      data: { isPaid: true, paidAt: new Date() },
    });
  }

  public async findUnpaid(therapistId: string, maxNet: number): Promise<EarningRecord[]> {
    const db = await this.db();
    const items = await db.earning.findMany({
      where: { therapistId, isPaid: false },
      orderBy: { createdAt: "asc" },
    });
    const selected: EarningRecord[] = [];
    let remaining = maxNet;
    for (const item of items) {
      if (remaining <= 0) break;
      selected.push(item as unknown as EarningRecord);
      remaining -= item.netAmount;
    }
    return selected;
  }
}

export const earningRepository = new EarningRepository();
