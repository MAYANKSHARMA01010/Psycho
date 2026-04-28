import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { complaintService } from "../services/complaint.service";

export class ComplaintController {
  public async raise(req: Request, res: Response) {
    const data = await complaintService.raise(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Complaint raised", data);
  }

  public async listMine(req: Request, res: Response) {
    const query = req.query as {
      page?: number;
      limit?: number;
      scope?: "raised" | "against" | "all";
      status?: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
    };

    const data = await complaintService.listMine(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Complaints fetched", data, data.meta);
  }

  public async getById(req: Request, res: Response) {
    const data = await complaintService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.complaintId),
    );
    return ApiResponse.success(res, 200, "Complaint fetched", data);
  }

  public async review(req: Request, res: Response) {
    const data = await complaintService.reviewByAdmin(
      req.user!.id,
      req.user!.role,
      String(req.params.complaintId),
      req.body,
    );
    return ApiResponse.success(res, 200, "Complaint reviewed", data);
  }
}

export const complaintController = new ComplaintController();
