import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { adminTherapistController } from "../controllers/admin.therapist.controller";
import { adminWithdrawalController } from "../controllers/earning.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  rejectTherapistSchema,
  therapistIdParamSchema,
  verificationListQuerySchema,
} from "../validators/therapist.validation";
import {
  listWithdrawalsQuerySchema,
  rejectWithdrawalSchema,
  withdrawalIdParamSchema,
} from "../validators/withdrawal.validation";

export default class AdminRoutes implements Routes {
  public path = "/api/v1/admin";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(AuthMiddleware.authenticate);
    this.router.use(AuthMiddleware.authorize(Role.ADMIN));

    this.router.get(
      "/therapists",
      ValidationMiddleware.validate(verificationListQuerySchema),
      AsyncUtils.wrap(adminTherapistController.list.bind(adminTherapistController)),
    );

    this.router.get(
      "/therapists/:therapistId",
      ValidationMiddleware.validate(therapistIdParamSchema),
      AsyncUtils.wrap(adminTherapistController.getReviewBundle.bind(adminTherapistController)),
    );

    this.router.get(
      "/therapists/:therapistId/documents",
      ValidationMiddleware.validate(therapistIdParamSchema),
      AsyncUtils.wrap(
        adminTherapistController.listTherapistDocuments.bind(adminTherapistController),
      ),
    );

    this.router.post(
      "/therapists/:therapistId/approve",
      ValidationMiddleware.validate(therapistIdParamSchema),
      AsyncUtils.wrap(adminTherapistController.approve.bind(adminTherapistController)),
    );

    this.router.post(
      "/therapists/:therapistId/reject",
      ValidationMiddleware.validate(therapistIdParamSchema),
      ValidationMiddleware.validate(rejectTherapistSchema),
      AsyncUtils.wrap(adminTherapistController.reject.bind(adminTherapistController)),
    );

    // Withdrawals (Member 4)
    this.router.get(
      "/withdrawals",
      ValidationMiddleware.validate(listWithdrawalsQuerySchema),
      AsyncUtils.wrap(adminWithdrawalController.list.bind(adminWithdrawalController)),
    );

    this.router.post(
      "/withdrawals/:withdrawalId/approve",
      ValidationMiddleware.validate(withdrawalIdParamSchema),
      AsyncUtils.wrap(adminWithdrawalController.approve.bind(adminWithdrawalController)),
    );

    this.router.post(
      "/withdrawals/:withdrawalId/reject",
      ValidationMiddleware.validate(withdrawalIdParamSchema),
      ValidationMiddleware.validate(rejectWithdrawalSchema),
      AsyncUtils.wrap(adminWithdrawalController.reject.bind(adminWithdrawalController)),
    );

    this.router.post(
      "/withdrawals/:withdrawalId/paid",
      ValidationMiddleware.validate(withdrawalIdParamSchema),
      AsyncUtils.wrap(adminWithdrawalController.markPaid.bind(adminWithdrawalController)),
    );
  }
}
