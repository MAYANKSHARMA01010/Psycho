import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { AsyncUtils } from "../utils/asyncHandler";
import { ValidationMiddleware } from "../middlewares/validate";
import { paymentController } from "../controllers/payment.controller";
import {
  initiatePaymentSchema,
  confirmPaymentSchema,
  refundPaymentSchema,
  paymentIdParamSchema,
} from "../validators/payment.validation";
import { Role } from "../constants/roles";

export default class PaymentRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Initiate a payment for a session
    this.router.post(
      "/payments/initiate",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate({ body: initiatePaymentSchema.shape.body }),
      AsyncUtils.wrap(paymentController.initiate.bind(paymentController)),
    );

    // Confirm a payment after gateway callback
    this.router.post(
      "/payments/confirm",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT),
      ValidationMiddleware.validate({ body: confirmPaymentSchema.shape.body }),
      AsyncUtils.wrap(paymentController.confirm.bind(paymentController)),
    );

    // Refund a completed payment (Admin only)
    this.router.post(
      "/payments/:id/refund",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate({
        params: refundPaymentSchema.shape.params,
        body: refundPaymentSchema.shape.body,
      }),
      AsyncUtils.wrap(paymentController.refund.bind(paymentController)),
    );

    // Get invoice for a payment
    this.router.get(
      "/payments/:id/invoice",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.ADMIN),
      ValidationMiddleware.validate({ params: paymentIdParamSchema.shape.params }),
      AsyncUtils.wrap(paymentController.getInvoice.bind(paymentController)),
    );

    // Get a specific payment
    this.router.get(
      "/payments/:id",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.CLIENT, Role.ADMIN),
      ValidationMiddleware.validate({ params: paymentIdParamSchema.shape.params }),
      AsyncUtils.wrap(paymentController.getById.bind(paymentController)),
    );
  }
}
