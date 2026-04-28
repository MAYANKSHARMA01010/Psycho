import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { ratingController } from "../controllers/rating.controller";
import {
  createRatingSchema,
  ratingListQuerySchema,
  therapistIdParamSchema,
} from "../validators/rating.validation";

export default class RatingRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/ratings",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate(createRatingSchema),
      AsyncUtils.wrap(ratingController.create.bind(ratingController)),
    );

    this.router.get(
      "/ratings/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.THERAPIST, Role.ADMIN),
      ValidationMiddleware.validate(ratingListQuerySchema),
      AsyncUtils.wrap(ratingController.listMine.bind(ratingController)),
    );

    this.router.get(
      "/therapists/:therapistId/ratings",
      ValidationMiddleware.validate(therapistIdParamSchema),
      ValidationMiddleware.validate(ratingListQuerySchema),
      AsyncUtils.wrap(ratingController.listForTherapist.bind(ratingController)),
    );
  }
}
