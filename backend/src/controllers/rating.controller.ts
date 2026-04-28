import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ratingService } from "../services/rating.service";

export class RatingController {
  public async create(req: Request, res: Response) {
    const data = await ratingService.create(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Rating submitted", data);
  }

  public async listMine(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number };
    const data = await ratingService.listMine(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Ratings fetched", data, data.meta);
  }

  public async listForTherapist(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number };
    const data = await ratingService.listForTherapist(String(req.params.therapistId), query);
    return ApiResponse.success(res, 200, "Therapist ratings fetched", data, data.meta);
  }
}

export const ratingController = new RatingController();
