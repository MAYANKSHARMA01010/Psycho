import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { subscriptionService } from "../services/subscription.service";

export class SubscriptionController {
  public async create(req: Request, res: Response) {
    const body = req.body as { planName: string };
    const data = await subscriptionService.create(req.user!.id, req.user!.role, body);
    return ApiResponse.success(res, 201, "Subscription created successfully", data);
  }

  public async renew(req: Request, res: Response) {
    const data = await subscriptionService.renew(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
    );
    return ApiResponse.success(res, 200, "Subscription renewed successfully", data);
  }

  public async cancel(req: Request, res: Response) {
    const data = await subscriptionService.cancel(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
    );
    return ApiResponse.success(res, 200, "Subscription cancelled successfully", data);
  }

  public async getMine(req: Request, res: Response) {
    const data = await subscriptionService.getMySubscription(req.user!.id, req.user!.role);
    return ApiResponse.success(res, 200, "Subscription fetched", data);
  }
}

export const subscriptionController = new SubscriptionController();
