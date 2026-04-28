import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { assessmentService } from "../services/assessment.service";
import { treatmentPlanService } from "../services/treatmentPlan.service";

export class AssessmentController {
  public async submit(req: Request, res: Response) {
    const data = await assessmentService.submit(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Assessment submitted", data);
  }

  public async listOwn(req: Request, res: Response) {
    const q = req.query as unknown as { page: number; limit: number };
    const data = await assessmentService.listOwn(req.user!.id, req.user!.role, q.page, q.limit);
    return ApiResponse.success(res, 200, "Assessments fetched", data);
  }

  public async getById(req: Request, res: Response) {
    const data = await assessmentService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.assessmentId),
    );
    return ApiResponse.success(res, 200, "Assessment fetched", data);
  }

  public async latestForClient(req: Request, res: Response) {
    const data = await assessmentService.latestForClient(
      req.user!.id,
      req.user!.role,
      String(req.params.clientId),
    );
    return ApiResponse.success(res, 200, "Latest assessment fetched", data);
  }
}

export class TreatmentPlanController {
  public async create(req: Request, res: Response) {
    const data = await treatmentPlanService.create(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Treatment plan created", data);
  }

  public async getById(req: Request, res: Response) {
    const data = await treatmentPlanService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
    );
    return ApiResponse.success(res, 200, "Treatment plan fetched", data);
  }

  public async listForClient(req: Request, res: Response) {
    const data = await treatmentPlanService.listForClient(
      req.user!.id,
      req.user!.role,
      String(req.params.clientId),
    );
    return ApiResponse.success(res, 200, "Plans fetched", data);
  }

  public async listOwnAsTherapist(req: Request, res: Response) {
    const data = await treatmentPlanService.listOwnAsTherapist(req.user!.id, req.user!.role);
    return ApiResponse.success(res, 200, "Plans fetched", data);
  }

  public async completeMilestone(req: Request, res: Response) {
    const data = await treatmentPlanService.completeMilestone(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
      String(req.params.milestoneId),
    );
    return ApiResponse.success(res, 200, "Milestone completed", data);
  }

  public async uncompleteMilestone(req: Request, res: Response) {
    const data = await treatmentPlanService.uncompleteMilestone(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
      String(req.params.milestoneId),
    );
    return ApiResponse.success(res, 200, "Milestone reopened", data);
  }

  public async cancel(req: Request, res: Response) {
    const data = await treatmentPlanService.cancel(
      req.user!.id,
      req.user!.role,
      String(req.params.planId),
    );
    return ApiResponse.success(res, 200, "Plan cancelled", data);
  }
}

export const assessmentController = new AssessmentController();
export const treatmentPlanController = new TreatmentPlanController();
