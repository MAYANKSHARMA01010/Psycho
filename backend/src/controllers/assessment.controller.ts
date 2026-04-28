import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { assessmentService } from "../services/assessment.service";

export class AssessmentController {
  public async submit(req: Request, res: Response) {
    const data = await assessmentService.submit(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Assessment submitted", data);
  }

  public async getMine(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number };
    const data = await assessmentService.getMine(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Assessments fetched", data, data.meta);
  }

  public async getById(req: Request, res: Response) {
    const data = await assessmentService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.assessmentId),
    );
    return ApiResponse.success(res, 200, "Assessment fetched", data);
  }

  public async getClientAssessments(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number };
    const data = await assessmentService.getClientAssessments(
      req.user!.role,
      String(req.params.clientId),
      query,
    );
    return ApiResponse.success(res, 200, "Client assessments fetched", data, data.meta);
  }
}

export const assessmentController = new AssessmentController();
