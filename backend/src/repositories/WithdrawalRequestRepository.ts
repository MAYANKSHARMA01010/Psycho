import { DatabaseService } from "../config/database";
import { WithdrawalRequest } from "../entities/WithdrawalRequest";

export interface ListWithdrawalsOptions {
  status?: string;
  page?: number;
  limit?: number;
}

export class WithdrawalRequestRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(withdrawal: WithdrawalRequest): Promise<WithdrawalRequest> {
    const db = await this.db();
    const record = await db.withdrawalRequest.create({
      data: {
        id: withdrawal.id,
        therapistId: withdrawal.therapistId,
        amount: withdrawal.amount,
        status: withdrawal.status as any,
        notes: withdrawal.notes,
        processedAt: withdrawal.processedAt,
        requestedAt: withdrawal.requestedAt,
      },
    });
    return WithdrawalRequest.fromPersistence(record);
  }

  public async findById(id: string): Promise<WithdrawalRequest | null> {
    const db = await this.db();
    const record = await db.withdrawalRequest.findUnique({ where: { id } });
    return record ? WithdrawalRequest.fromPersistence(record) : null;
  }

  public async save(withdrawal: WithdrawalRequest): Promise<WithdrawalRequest> {
    const db = await this.db();
    const record = await db.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: {
        status: withdrawal.status as any,
        notes: withdrawal.notes,
        processedAt: withdrawal.processedAt,
        updatedAt: new Date(),
      },
    });
    return WithdrawalRequest.fromPersistence(record);
  }

  public async listForTherapist(
    therapistId: string,
    opts: ListWithdrawalsOptions = {},
  ): Promise<{ withdrawals: WithdrawalRequest[]; total: number }> {
    const db = await this.db();
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, opts.limit ?? 20);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { therapistId };
    if (opts.status) filter.status = opts.status;

    const [records, total] = await Promise.all([
      db.withdrawalRequest.findMany({
        where: filter,
        orderBy: { requestedAt: "desc" },
        skip,
        take: limit,
      }),
      db.withdrawalRequest.count({ where: filter }),
    ]);

    return { withdrawals: records.map((r: any) => WithdrawalRequest.fromPersistence(r)), total };
  }

  /**
   * Check if the therapist has any pending withdrawal requests already.
   */
  public async hasPendingWithdrawal(therapistId: string): Promise<boolean> {
    const db = await this.db();
    const count = await db.withdrawalRequest.count({
      where: { therapistId, status: "PENDING" },
    });
    return count > 0;
  }
}

export const withdrawalRequestRepository = new WithdrawalRequestRepository();
