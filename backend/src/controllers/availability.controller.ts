import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { availabilityService } from "../services/availability.service";

export class AvailabilityController {
  public async createSlots(req: Request, res: Response) {
    const data = await availabilityService.createSlots(
      req.user!.id,
      req.user!.role,
      req.body,
    );
    return ApiResponse.success(res, 201, "Slots created", data);
  }

  public async listOwnSlots(req: Request, res: Response) {
    const q = req.query as { from?: Date; to?: Date; onlyAvailable?: boolean };
    const data = await availabilityService.listOwnSlots(req.user!.id, req.user!.role, q);
    return ApiResponse.success(res, 200, "Slots fetched", data);
  }

  public async listForTherapist(req: Request, res: Response) {
    const q = req.query as { from?: Date; to?: Date };
    const data = await availabilityService.listForTherapist(String(req.params.therapistId), q);
    return ApiResponse.success(res, 200, "Available slots fetched", data);
  }

  public async updateSlot(req: Request, res: Response) {
    const data = await availabilityService.updateSlot(
      req.user!.id,
      req.user!.role,
      String(req.params.slotId),
      req.body,
    );
    return ApiResponse.success(res, 200, "Slot updated", data);
  }

  public async deleteSlot(req: Request, res: Response) {
    await availabilityService.deleteSlot(req.user!.id, req.user!.role, String(req.params.slotId));
    return ApiResponse.success(res, 200, "Slot deleted", null);
  }
}

export const availabilityController = new AvailabilityController();
