import { Router } from "express";
import express from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { paymentController } from "../controllers/payment.controller";
import { Routes } from "../interfaces/route.interface";
import { Role } from "../constants/roles";
import {
  initiatePaymentSchema,
  listPaymentsQuerySchema,
  paymentIdParamSchema,
  refundPaymentSchema,
} from "../validators/payment.validation";

export default class PaymentRoutes implements Routes {
  public path = "/api/v1/payments";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Stripe webhook — must run with raw body, BEFORE the global json parser
    // would eat it. Mounted as a sibling route via raw body parser here.
    this.router.post(
      "/webhook",
      express.raw({ type: "application/json" }),
      AsyncUtils.wrap(paymentController.webhook.bind(paymentController)),
    );

    this.router.post(
      "/",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate(initiatePaymentSchema),
      AsyncUtils.wrap(paymentController.initiate.bind(paymentController)),
    );

    this.router.get(
      "/me",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(listPaymentsQuerySchema),
      AsyncUtils.wrap(paymentController.listOwn.bind(paymentController)),
    );

    this.router.get(
      "/:paymentId",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(paymentIdParamSchema),
      AsyncUtils.wrap(paymentController.getById.bind(paymentController)),
    );

    this.router.post(
      "/:paymentId/refund",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(paymentIdParamSchema),
      ValidationMiddleware.validate(refundPaymentSchema),
      AsyncUtils.wrap(paymentController.refund.bind(paymentController)),
    );
  }
}
