import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { AsyncUtils } from "../utils/asyncHandler";
import { ValidationMiddleware } from "../middlewares/validate";
import { financialController } from "../controllers/financial.controller";
import {
  earningsQuerySchema,
  requestWithdrawalSchema,
  withdrawalsQuerySchema,
  processWithdrawalSchema,
  transactionHistoryQuerySchema,
} from "../validators/financial.validation";
import { Role } from "../constants/roles";

export default class FinancialRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ── Earnings ──────────────────────────────────────────────────────
    this.router.get(
      "/financial/earnings",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(financialController.getEarnings.bind(financialController)),
    );

    this.router.get(
      "/financial/earnings/summary",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(financialController.getEarningsSummary.bind(financialController)),
    );

    // ── Withdrawals ──────────────────────────────────────────────────
    this.router.post(
      "/financial/withdrawals",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate({ body: requestWithdrawalSchema.shape.body }),
      AsyncUtils.wrap(financialController.requestWithdrawal.bind(financialController)),
    );

    this.router.get(
      "/financial/withdrawals",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(financialController.getWithdrawals.bind(financialController)),
    );

    // Admin: process a withdrawal request
    this.router.patch(
      "/financial/withdrawals/:id",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate({
        params: processWithdrawalSchema.shape.params,
        body: processWithdrawalSchema.shape.body,
      }),
      AsyncUtils.wrap(financialController.processWithdrawal.bind(financialController)),
    );

    // ── Transaction History ──────────────────────────────────────────
    this.router.get(
      "/financial/transactions",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST),
      AsyncUtils.wrap(financialController.getTransactionHistory.bind(financialController)),
    );
  }
}
