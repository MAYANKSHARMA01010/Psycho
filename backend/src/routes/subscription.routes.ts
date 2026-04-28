import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { AsyncUtils } from "../utils/asyncHandler";
import { ValidationMiddleware } from "../middlewares/validate";
import { subscriptionController } from "../controllers/subscription.controller";
import {
  createSubscriptionSchema,
  subscriptionIdParamSchema,
} from "../validators/subscription.validation";
import { Role } from "../constants/roles";

export default class SubscriptionRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get my current subscription
    this.router.get(
      "/subscriptions/me",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      AsyncUtils.wrap(subscriptionController.getMine.bind(subscriptionController)),
    );

    // Create a new subscription
    this.router.post(
      "/subscriptions",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate({ body: createSubscriptionSchema.shape.body }),
      AsyncUtils.wrap(subscriptionController.create.bind(subscriptionController)),
    );

    // Renew subscription
    this.router.post(
      "/subscriptions/:id/renew",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate({ params: subscriptionIdParamSchema.shape.params }),
      AsyncUtils.wrap(subscriptionController.renew.bind(subscriptionController)),
    );

    // Cancel subscription
    this.router.post(
      "/subscriptions/:id/cancel",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate({ params: subscriptionIdParamSchema.shape.params }),
      AsyncUtils.wrap(subscriptionController.cancel.bind(subscriptionController)),
    );
  }
}
