import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import {
  assessmentController,
  treatmentPlanController,
} from "../controllers/assessment.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  assessmentIdParamSchema,
  clientIdParamSchema,
  createTreatmentPlanSchema,
  listAssessmentsQuerySchema,
  milestoneParamSchema,
  planIdParamSchema,
  submitAssessmentSchema,
} from "../validators/assessment.validation";

export default class AssessmentRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Assessments
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
      ValidationMiddleware.validate(listAssessmentsQuerySchema),
      AsyncUtils.wrap(assessmentController.listOwn.bind(assessmentController)),
    );

    this.router.get(
      "/assessments/:assessmentId",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(assessmentIdParamSchema),
      AsyncUtils.wrap(assessmentController.getById.bind(assessmentController)),
    );

    this.router.get(
      "/clients/:clientId/assessments/latest",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(clientIdParamSchema),
      AsyncUtils.wrap(assessmentController.latestForClient.bind(assessmentController)),
    );

    // Treatment plans
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
      AuthMiddleware.authorize(Role.THERAPIST),
      AsyncUtils.wrap(
        treatmentPlanController.listOwnAsTherapist.bind(treatmentPlanController),
      ),
    );

    this.router.get(
      "/treatment-plans/:planId",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(planIdParamSchema),
      AsyncUtils.wrap(treatmentPlanController.getById.bind(treatmentPlanController)),
    );

    this.router.get(
      "/clients/:clientId/treatment-plans",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(clientIdParamSchema),
      AsyncUtils.wrap(treatmentPlanController.listForClient.bind(treatmentPlanController)),
    );

    this.router.post(
      "/treatment-plans/:planId/milestones/:milestoneId/complete",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST),
      ValidationMiddleware.validate(milestoneParamSchema),
      AsyncUtils.wrap(treatmentPlanController.completeMilestone.bind(treatmentPlanController)),
    );

    this.router.post(
      "/treatment-plans/:planId/milestones/:milestoneId/reopen",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST),
      ValidationMiddleware.validate(milestoneParamSchema),
      AsyncUtils.wrap(
        treatmentPlanController.uncompleteMilestone.bind(treatmentPlanController),
      ),
    );

    this.router.post(
      "/treatment-plans/:planId/cancel",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(planIdParamSchema),
      AsyncUtils.wrap(treatmentPlanController.cancel.bind(treatmentPlanController)),
    );
  }
}
