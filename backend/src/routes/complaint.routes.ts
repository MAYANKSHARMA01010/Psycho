import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { complaintController } from "../controllers/complaint.controller";
import {
  raiseComplaintSchema,
  complaintIdParamSchema,
  complaintListQuerySchema,
  reviewComplaintSchema,
} from "../validators/complaint.validation";

export default class ComplaintRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/complaints",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST),
      ValidationMiddleware.validate(raiseComplaintSchema),
      AsyncUtils.wrap(complaintController.raise.bind(complaintController)),
    );

    this.router.get(
      "/complaints/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(complaintListQuerySchema),
      AsyncUtils.wrap(complaintController.listMine.bind(complaintController)),
    );

    this.router.get(
      "/complaints/:complaintId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(complaintIdParamSchema),
      AsyncUtils.wrap(complaintController.getById.bind(complaintController)),
    );

    this.router.patch(
      "/admin/complaints/:complaintId",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate(complaintIdParamSchema),
      ValidationMiddleware.validate(reviewComplaintSchema),
      AsyncUtils.wrap(complaintController.review.bind(complaintController)),
    );

    this.router.get(
      "/admin/complaints",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate(complaintListQuerySchema),
      AsyncUtils.wrap(complaintController.listMine.bind(complaintController)),
    );
  }
}
