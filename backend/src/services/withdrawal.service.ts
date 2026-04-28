import { Role } from "../constants/roles";
import { env } from "../config/env";
import {
  WithdrawalRepository,
  withdrawalRepository,
} from "../repositories/WithdrawalRepository";
import {
  EarningRepository,
  earningRepository,
} from "../repositories/EarningRepository";
import { ApiError } from "../utils/ApiError";

const MIN_WITHDRAWAL = 100;

export class WithdrawalService {
  constructor(
    private readonly withdrawals: WithdrawalRepository = withdrawalRepository,
    private readonly earnings: EarningRepository = earningRepository,
  ) {}

  public async request(userId: string, userRole: string, amount: number, notes?: string) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can request withdrawals");
    }
    if (amount < MIN_WITHDRAWAL) {
      throw ApiError.badRequest(`Minimum withdrawal amount is ${MIN_WITHDRAWAL}`);
    }

    const balance = await this.earnings.availableBalance(userId);
    if (amount > balance) {
      throw ApiError.badRequest(
        `Requested amount exceeds available balance (${balance.toFixed(2)})`,
      );
    }

    const withdrawal = await this.withdrawals.create({
      therapistId: userId,
      amount,
      currency: env.STRIPE_CURRENCY.toUpperCase(),
      notes,
    });

    return { withdrawal };
  }

  public async listOwn(
    userId: string,
    userRole: string,
    pagination: { page: number; limit: number },
  ) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can view their withdrawals");
    }
    const result = await this.withdrawals.list({ ...pagination, therapistId: userId });
    return {
      items: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async listAll(
    userRole: string,
    pagination: { page: number; limit: number; status?: string },
  ) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can view all withdrawals");
    }
    const result = await this.withdrawals.list({
      page: pagination.page,
      limit: pagination.limit,
      status: pagination.status as any,
    });
    return {
      items: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async approve(userRole: string, withdrawalId: string) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can approve withdrawals");
    }
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) throw ApiError.notFound("Withdrawal");
    if (withdrawal.status !== "PENDING") {
      throw ApiError.conflict(`Withdrawal is already ${withdrawal.status}`);
    }
    const updated = await this.withdrawals.updateStatus(withdrawalId, "APPROVED");
    return { withdrawal: updated };
  }

  public async reject(userRole: string, withdrawalId: string, reason: string) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can reject withdrawals");
    }
    if (!reason.trim()) throw ApiError.badRequest("Rejection reason is required");

    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) throw ApiError.notFound("Withdrawal");
    if (withdrawal.status !== "PENDING") {
      throw ApiError.conflict(`Withdrawal is already ${withdrawal.status}`);
    }
    const updated = await this.withdrawals.updateStatus(withdrawalId, "REJECTED", reason);
    return { withdrawal: updated };
  }

  public async markPaid(userRole: string, withdrawalId: string) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can mark withdrawals as paid");
    }
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) throw ApiError.notFound("Withdrawal");
    if (withdrawal.status !== "APPROVED") {
      throw ApiError.conflict("Withdrawal must be approved before being marked paid");
    }

    const earnings = await this.earnings.findUnpaid(withdrawal.therapistId, withdrawal.amount);
    await this.earnings.markPaid(
      withdrawal.therapistId,
      earnings.map((e) => e.id),
    );

    const updated = await this.withdrawals.updateStatus(withdrawalId, "PAID");
    return { withdrawal: updated };
  }
}

export const withdrawalService = new WithdrawalService();
