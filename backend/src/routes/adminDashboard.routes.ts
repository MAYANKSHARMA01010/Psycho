import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { adminDashboardController } from "../controllers/adminDashboard.controller";
import {
  analyticsQuerySchema,
  highRiskQuerySchema,
} from "../validators/adminDashboard.validation";

export default class AdminDashboardRoutes implements Routes {
  public path = "/api/v1/admin/dashboard";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(AuthMiddleware.authenticate);
    this.router.use(AuthMiddleware.authorize(Role.ADMIN));

    this.router.get(
      "/analytics",
      ValidationMiddleware.validate(analyticsQuerySchema),
      AsyncUtils.wrap(adminDashboardController.getAnalytics.bind(adminDashboardController)),
    );

    this.router.get(
      "/complaints",
      ValidationMiddleware.validate(analyticsQuerySchema),
      AsyncUtils.wrap(adminDashboardController.getComplaintSummary.bind(adminDashboardController)),
    );

    this.router.get(
      "/crisis/high-risk",
      ValidationMiddleware.validate(highRiskQuerySchema),
      AsyncUtils.wrap(adminDashboardController.getHighRiskUsers.bind(adminDashboardController)),
    );

    this.router.get(
      "/notifications/summary",
      AsyncUtils.wrap(adminDashboardController.getNotificationSummary.bind(adminDashboardController)),
    );
  }
}
