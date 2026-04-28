import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { assessmentController } from "../controllers/assessment.controller";
import {
  submitAssessmentSchema,
  assessmentIdParamSchema,
  assessmentListQuerySchema,
  clientIdParamSchema,
} from "../validators/assessment.validation";

export default class AssessmentRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/assessments",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate(submitAssessmentSchema),
      AsyncUtils.wrap(assessmentController.submit.bind(assessmentController)),
    );

    this.router.get(
      "/assessments/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate(assessmentListQuerySchema),
      AsyncUtils.wrap(assessmentController.getMine.bind(assessmentController)),
    );

    this.router.get(
      "/assessments/:assessmentId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(assessmentIdParamSchema),
      AsyncUtils.wrap(assessmentController.getById.bind(assessmentController)),
    );

    this.router.get(
      "/clients/:clientId/assessments",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(clientIdParamSchema),
      ValidationMiddleware.validate(assessmentListQuerySchema),
      AsyncUtils.wrap(assessmentController.getClientAssessments.bind(assessmentController)),
    );
  }
}
