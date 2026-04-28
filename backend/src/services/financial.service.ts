import { Role } from "../constants/roles";
import { WithdrawalRequest } from "../entities/WithdrawalRequest";
import {
  EarningRepository,
  earningRepository,
} from "../repositories/EarningRepository";
import {
  WithdrawalRequestRepository,
  withdrawalRequestRepository,
} from "../repositories/WithdrawalRequestRepository";
import {
  PaymentRepository,
  paymentRepository,
} from "../repositories/PaymentRepository";
import { ApiError } from "../utils/ApiError";

export class FinancialService {
  constructor(
    private readonly earnings: EarningRepository = earningRepository,
    private readonly withdrawals: WithdrawalRequestRepository = withdrawalRequestRepository,
    private readonly payments: PaymentRepository = paymentRepository,
  ) {}

  // ── Therapist Earnings ────────────────────────────────────────────────
  public async getEarnings(userId: string, userRole: string, opts: {
    isPaid?: string;
    page?: string;
    limit?: string;
  }) {
    this.ensureRole(userRole, Role.THERAPIST);

    const result = await this.earnings.listForTherapist(userId, {
      isPaid: opts.isPaid !== undefined ? opts.isPaid === "true" : undefined,
      page: opts.page ? parseInt(opts.page, 10) : 1,
      limit: opts.limit ? parseInt(opts.limit, 10) : 20,
    });

    return {
      earnings: result.earnings.map((e) => e.toResponse()),
      total: result.total,
    };
  }

  // ── Earnings Summary ──────────────────────────────────────────────────
  public async getEarningsSummary(userId: string, userRole: string) {
    this.ensureRole(userRole, Role.THERAPIST);
    const summary = await this.earnings.getSummary(userId);
    return { summary };
  }

  // ── Request Withdrawal ────────────────────────────────────────────────
  public async requestWithdrawal(userId: string, userRole: string, payload: {
    amount: number;
  }) {
    this.ensureRole(userRole, Role.THERAPIST);

    // Check if there's already a pending withdrawal
    const hasPending = await this.withdrawals.hasPendingWithdrawal(userId);
    if (hasPending) {
      throw ApiError.conflict("You already have a pending withdrawal request. Please wait for it to be processed.");
    }

    // Validate available balance
    const availableBalance = await this.earnings.getAvailableBalance(userId);
    if (payload.amount > availableBalance) {
      throw ApiError.badRequest(
        `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}, Requested: ₹${payload.amount.toFixed(2)}`,
      );
    }

    const withdrawal = WithdrawalRequest.create({
      therapistId: userId,
      amount: payload.amount,
    });

    const saved = await this.withdrawals.create(withdrawal);
    return { withdrawal: saved.toResponse(), availableBalance };
  }

  // ── List Withdrawal Requests ──────────────────────────────────────────
  public async getWithdrawals(userId: string, userRole: string, opts: {
    status?: string;
    page?: string;
    limit?: string;
  }) {
    this.ensureRole(userRole, Role.THERAPIST);

    const result = await this.withdrawals.listForTherapist(userId, {
      status: opts.status,
      page: opts.page ? parseInt(opts.page, 10) : 1,
      limit: opts.limit ? parseInt(opts.limit, 10) : 20,
    });

    return {
      withdrawals: result.withdrawals.map((w) => w.toResponse()),
      total: result.total,
    };
  }

  // ── Admin: Process Withdrawal ─────────────────────────────────────────
  public async processWithdrawal(userId: string, userRole: string, withdrawalId: string, payload: {
    action: "approve" | "reject";
    notes?: string;
  }) {
    this.ensureRole(userRole, Role.ADMIN);

    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) throw ApiError.notFound("Withdrawal request");

    if (payload.action === "approve") {
      withdrawal.approve(payload.notes);
      // Mark the corresponding earnings as paid
      await this.earnings.markEarningsAsPaid(
        withdrawal.therapistId,
        withdrawal.id,
        withdrawal.amount,
      );
      // Auto-complete after approval (in a real system, this would be after bank transfer confirmation)
      withdrawal.complete();
    } else {
      withdrawal.reject(payload.notes ?? "Withdrawal request rejected by admin");
    }

    const saved = await this.withdrawals.save(withdrawal);
    return { withdrawal: saved.toResponse() };
  }

  // ── Transaction History (unified for both roles) ──────────────────────
  public async getTransactionHistory(userId: string, userRole: string, opts: {
    page?: string;
    limit?: string;
  }) {
    const page = opts.page ? parseInt(opts.page, 10) : 1;
    const limit = opts.limit ? parseInt(opts.limit, 10) : 20;

    if (userRole === Role.CLIENT) {
      const result = await this.payments.listForClient(userId, { page, limit });
      const transactions = result.payments.map((p) => ({
        id: p.id,
        type: "PAYMENT" as const,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        description: `Session payment via ${p.method}`,
        date: p.paidAt ?? p.createdAt,
        metadata: { sessionId: p.sessionId, method: p.method },
      }));
      return { transactions, total: result.total };
    }

    if (userRole === Role.THERAPIST) {
      // Combine earnings and withdrawals into a single timeline
      const [earningsResult, withdrawalsResult] = await Promise.all([
        this.earnings.listForTherapist(userId, { page, limit }),
        this.withdrawals.listForTherapist(userId, { page, limit }),
      ]);

      const earningTxns = earningsResult.earnings.map((e) => ({
        id: e.id,
        type: "EARNING" as const,
        amount: e.netAmount,
        currency: "INR",
        status: e.isPaid ? "PAID" : "AVAILABLE",
        description: `Session earning (₹${e.amount} - ₹${e.platformCommission} commission)`,
        date: e.createdAt,
        metadata: {
          sessionId: e.sessionId,
          grossAmount: e.amount,
          commission: e.platformCommission,
        },
      }));

      const withdrawalTxns = withdrawalsResult.withdrawals.map((w) => ({
        id: w.id,
        type: "WITHDRAWAL" as const,
        amount: w.amount,
        currency: "INR",
        status: w.status,
        description: `Withdrawal request`,
        date: w.requestedAt,
        metadata: {
          processedAt: w.processedAt,
          notes: w.notes,
        },
      }));

      // Merge and sort by date descending
      const all = [...earningTxns, ...withdrawalTxns].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return {
        transactions: all.slice(0, limit),
        total: earningsResult.total + withdrawalsResult.total,
      };
    }

    throw ApiError.forbidden();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private ensureRole(userRole: string, required: Role): void {
    if (userRole !== required) {
      throw ApiError.forbidden(`Only ${required.toLowerCase()}s can perform this action`);
    }
  }
}

export const financialService = new FinancialService();
