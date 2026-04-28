import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { treatmentPlanService } from "../services/treatmentPlan.service";

export class TreatmentPlanController {
  public async create(req: Request, res: Response) {
    const data = await treatmentPlanService.create(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Treatment plan created", data);
  }

  public async listMine(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number };
    const data = await treatmentPlanService.listMine(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Treatment plans fetched", data, data.meta);
  }

  public async getById(req: Request, res: Response) {
    const data = await treatmentPlanService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
    );
    return ApiResponse.success(res, 200, "Treatment plan fetched", data);
  }

  public async updateMilestoneProgress(req: Request, res: Response) {
    const data = await treatmentPlanService.updateMilestoneProgress(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
      String(req.params.milestoneId),
      req.body,
    );
    return ApiResponse.success(res, 200, "Milestone progress updated", data);
  }

  public async updateStatus(req: Request, res: Response) {
    const data = await treatmentPlanService.updatePlanStatus(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
      req.body,
    );
    return ApiResponse.success(res, 200, "Treatment plan status updated", data);
  }
}

export const treatmentPlanController = new TreatmentPlanController();
