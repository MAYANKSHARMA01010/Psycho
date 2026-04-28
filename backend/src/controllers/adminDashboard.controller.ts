import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { adminDashboardService } from "../services/adminDashboard.service";

export class AdminDashboardController {
  public async getAnalytics(req: Request, res: Response) {
    const query = req.query as { from?: Date; to?: Date };
    const data = await adminDashboardService.getAnalytics(req.user!.role, query);
    return ApiResponse.success(res, 200, "Analytics fetched", data);
  }

  public async getComplaintSummary(req: Request, res: Response) {
    const query = req.query as { from?: Date; to?: Date };
    const data = await adminDashboardService.getComplaintSummary(req.user!.role, query);
    return ApiResponse.success(res, 200, "Complaint summary fetched", data);
  }

  public async getHighRiskUsers(req: Request, res: Response) {
    const query = req.query as { days?: number; limit?: number };
    const data = await adminDashboardService.getHighRiskUsers(req.user!.role, query);
    return ApiResponse.success(res, 200, "High-risk users fetched", data);
  }

  public async getNotificationSummary(req: Request, res: Response) {
    const data = await adminDashboardService.getNotificationSummary(req.user!.role);
    return ApiResponse.success(res, 200, "Notification summary fetched", data);
  }
}

export const adminDashboardController = new AdminDashboardController();
