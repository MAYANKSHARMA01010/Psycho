import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface WithdrawalRecord {
  id: string;
  therapistId: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  notes: string | null;
  rejectionReason: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WithdrawalRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(input: {
    therapistId: string;
    amount: number;
    currency: string;
    notes?: string | null;
  }): Promise<WithdrawalRecord> {
    const db = await this.db();
    const record = await db.withdrawal.create({
      data: {
        id: randomUUID(),
        therapistId: input.therapistId,
        amount: input.amount,
        currency: input.currency,
        status: "PENDING",
        notes: input.notes ?? null,
      },
    });
    return record as unknown as WithdrawalRecord;
  }

  public async findById(id: string): Promise<WithdrawalRecord | null> {
    const db = await this.db();
    const record = await db.withdrawal.findUnique({ where: { id } });
    return (record as unknown as WithdrawalRecord) ?? null;
  }

  public async list(
    pagination: { page: number; limit: number; status?: WithdrawalStatus; therapistId?: string },
  ) {
    const db = await this.db();
    const where: Prisma.WithdrawalWhereInput = {};
    if (pagination.status) where.status = pagination.status;
    if (pagination.therapistId) where.therapistId = pagination.therapistId;
    const [items, total] = await Promise.all([
      db.withdrawal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      db.withdrawal.count({ where }),
    ]);
    return {
      items: items as unknown as WithdrawalRecord[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  public async updateStatus(
    id: string,
    status: WithdrawalStatus,
    rejectionReason?: string | null,
  ): Promise<WithdrawalRecord> {
    const db = await this.db();
    const record = await db.withdrawal.update({
      where: { id },
      data: {
        status,
        rejectionReason: rejectionReason ?? null,
        processedAt: status === "APPROVED" || status === "PAID" || status === "REJECTED"
          ? new Date()
          : null,
      },
    });
    return record as unknown as WithdrawalRecord;
  }
}

export const withdrawalRepository = new WithdrawalRepository();
