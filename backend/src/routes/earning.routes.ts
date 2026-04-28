import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { earningController } from "../controllers/earning.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  listWithdrawalsQuerySchema,
  requestWithdrawalSchema,
} from "../validators/withdrawal.validation";

export default class EarningRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/earnings/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(earningController.listOwn.bind(earningController)),
    );

    this.router.get(
      "/earnings/summary",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(earningController.summary.bind(earningController)),
    );

    this.router.post(
      "/withdrawals",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(requestWithdrawalSchema),
      AsyncUtils.wrap(earningController.requestWithdrawal.bind(earningController)),
    );

    this.router.get(
      "/withdrawals/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(listWithdrawalsQuerySchema),
      AsyncUtils.wrap(earningController.listOwnWithdrawals.bind(earningController)),
    );
  }
}
