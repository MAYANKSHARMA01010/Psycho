import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { treatmentPlanController } from "../controllers/treatmentPlan.controller";
import {
  createTreatmentPlanSchema,
  treatmentPlanIdParamSchema,
  milestoneParamSchema,
  updateMilestoneProgressSchema,
  updateTreatmentPlanStatusSchema,
  treatmentPlanListQuerySchema,
} from "../validators/treatmentPlan.validation";

export default class TreatmentPlanRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/treatment-plans",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(createTreatmentPlanSchema),
      AsyncUtils.wrap(treatmentPlanController.create.bind(treatmentPlanController)),
    );

    this.router.get(
      "/treatment-plans/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST),
      ValidationMiddleware.validate(treatmentPlanListQuerySchema),
      AsyncUtils.wrap(treatmentPlanController.listMine.bind(treatmentPlanController)),
    );

    this.router.get(
      "/treatment-plans/:planId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(treatmentPlanIdParamSchema),
      AsyncUtils.wrap(treatmentPlanController.getById.bind(treatmentPlanController)),
    );

    this.router.patch(
      "/treatment-plans/:planId/milestones/:milestoneId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(milestoneParamSchema),
      ValidationMiddleware.validate(updateMilestoneProgressSchema),
      AsyncUtils.wrap(treatmentPlanController.updateMilestoneProgress.bind(treatmentPlanController)),
    );

    this.router.patch(
      "/treatment-plans/:planId/status",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(treatmentPlanIdParamSchema),
      ValidationMiddleware.validate(updateTreatmentPlanStatusSchema),
      AsyncUtils.wrap(treatmentPlanController.updateStatus.bind(treatmentPlanController)),
    );
  }
}
