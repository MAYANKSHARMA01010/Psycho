import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { subscriptionController } from "../controllers/subscription.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  createSubscriptionSchema,
  renewSubscriptionSchema,
} from "../validators/subscription.validation";

export default class SubscriptionRoutes implements Routes {
  public path = "/api/v1/subscriptions";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/plans",
      AsyncUtils.wrap(subscriptionController.listPlans.bind(subscriptionController)),
    );

    this.router.post(
      "/",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate(createSubscriptionSchema),
      AsyncUtils.wrap(subscriptionController.create.bind(subscriptionController)),
    );

    this.router.get(
      "/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      AsyncUtils.wrap(subscriptionController.getOwn.bind(subscriptionController)),
    );

    this.router.post(
      "/renew",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate(renewSubscriptionSchema),
      AsyncUtils.wrap(subscriptionController.renew.bind(subscriptionController)),
    );

    this.router.post(
      "/cancel",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      AsyncUtils.wrap(subscriptionController.cancel.bind(subscriptionController)),
    );
  }
}
