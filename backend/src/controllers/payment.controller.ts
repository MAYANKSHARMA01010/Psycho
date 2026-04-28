import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paymentService } from "../services/payment.service";
import { StripeConfig, StripeEvent } from "../config/stripe";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

export class PaymentController {
  public async initiate(req: Request, res: Response) {
    const data = await paymentService.initiate(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Payment initiated", data);
  }

  public async getById(req: Request, res: Response) {
    const data = await paymentService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.paymentId),
    );
    return ApiResponse.success(res, 200, "Payment fetched", data);
  }

  public async listOwn(req: Request, res: Response) {
    const q = req.query as unknown as { page: number; limit: number; status?: string };
    const data = await paymentService.listOwn(req.user!.id, q);
    return ApiResponse.success(res, 200, "Payments fetched", data);
  }

  public async refund(req: Request, res: Response) {
    const data = await paymentService.refund(
      req.user!.id,
      req.user!.role,
      String(req.params.paymentId),
      req.body,
    );
    return ApiResponse.success(res, 200, "Payment refunded", data);
  }

  public async webhook(req: Request, res: Response) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw ApiError.internal("Stripe webhook is not configured");
    }
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      throw ApiError.badRequest("Missing stripe-signature header");
    }

    const stripe = StripeConfig.getInstance();
    let event: StripeEvent;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      logger.warn("[stripe] webhook signature verification failed", {
        error: (err as Error).message,
      });
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      await paymentService.handleWebhookEvent(event);
    } catch (err) {
      logger.error("[stripe] webhook handler failed", err as any);
      return res.status(500).json({ received: false });
    }

    return res.json({ received: true });
  }
}

export const paymentController = new PaymentController();
