import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { therapistVerificationService } from "../services/therapistVerification.service";
import { therapistDocumentService } from "../services/therapistDocument.service";
import { VerificationStatus } from "../entities/Therapist";

export class AdminTherapistController {
  public async list(req: Request, res: Response) {
    const q = req.query as unknown as { status: VerificationStatus; page: number; limit: number };
    const data = await therapistVerificationService.list(req.user!.role, q.status, {
      page: q.page,
      limit: q.limit,
    });
    return ApiResponse.success(res, 200, "Therapists fetched", data);
  }

  public async getReviewBundle(req: Request, res: Response) {
    const data = await therapistVerificationService.getReviewBundle(
      req.user!.role,
      String(req.params.therapistId),
    );
    return ApiResponse.success(res, 200, "Therapist review bundle fetched", data);
  }

  public async approve(req: Request, res: Response) {
    const data = await therapistVerificationService.approve(
      req.user!.role,
      String(req.params.therapistId),
    );
    return ApiResponse.success(res, 200, "Therapist approved", data);
  }

  public async reject(req: Request, res: Response) {
    const body = req.body as { reason: string };
    const data = await therapistVerificationService.reject(
      req.user!.role,
      String(req.params.therapistId),
      body.reason,
    );
    return ApiResponse.success(res, 200, "Therapist rejected", data);
  }

  public async listTherapistDocuments(req: Request, res: Response) {
    const data = await therapistDocumentService.listForTherapist(
      String(req.params.therapistId),
      req.user!.role,
    );
    return ApiResponse.success(res, 200, "Documents fetched", data);
  }
}

export const adminTherapistController = new AdminTherapistController();
