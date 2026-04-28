import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { subscriptionService } from "../services/subscription.service";

export class SubscriptionController {
  public async listPlans(_req: Request, res: Response) {
    return ApiResponse.success(res, 200, "Plans fetched", subscriptionService.listPlans());
  }

  public async create(req: Request, res: Response) {
    const body = req.body as { plan: string; autoRenew?: boolean };
    const data = await subscriptionService.create(
      req.user!.id,
      req.user!.role,
      body.plan,
      body.autoRenew ?? true,
    );
    return ApiResponse.success(res, 201, "Subscription created", data);
  }

  public async renew(req: Request, res: Response) {
    const body = req.body as { plan?: string };
    const data = await subscriptionService.renew(req.user!.id, body.plan);
    return ApiResponse.success(res, 200, "Subscription renewed", data);
  }

  public async cancel(req: Request, res: Response) {
    const data = await subscriptionService.cancel(req.user!.id);
    return ApiResponse.success(res, 200, "Subscription cancelled", data);
  }

  public async getOwn(req: Request, res: Response) {
    const data = await subscriptionService.getOwn(req.user!.id);
    return ApiResponse.success(res, 200, "Subscription fetched", data);
  }
}

export const subscriptionController = new SubscriptionController();
