import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { prescriptionController } from "../controllers/prescription.controller";
import {
  createPrescriptionSchema,
  prescriptionIdParamSchema,
  sharePrescriptionSchema,
  prescriptionListQuerySchema,
} from "../validators/prescription.validation";

export default class PrescriptionRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/prescriptions",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST),
      ValidationMiddleware.validate(createPrescriptionSchema),
      AsyncUtils.wrap(prescriptionController.create.bind(prescriptionController)),
    );

    this.router.get(
      "/prescriptions/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(prescriptionListQuerySchema),
      AsyncUtils.wrap(prescriptionController.listMine.bind(prescriptionController)),
    );

    this.router.get(
      "/prescriptions/:prescriptionId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(prescriptionIdParamSchema),
      AsyncUtils.wrap(prescriptionController.getById.bind(prescriptionController)),
    );

    this.router.post(
      "/prescriptions/:prescriptionId/pdf",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(prescriptionIdParamSchema),
      AsyncUtils.wrap(prescriptionController.generatePdf.bind(prescriptionController)),
    );

    this.router.post(
      "/prescriptions/:prescriptionId/share",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(prescriptionIdParamSchema),
      ValidationMiddleware.validate(sharePrescriptionSchema),
      AsyncUtils.wrap(prescriptionController.share.bind(prescriptionController)),
    );
  }
}
