import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { prescriptionService } from "../services/prescription.service";

export class PrescriptionController {
  public async create(req: Request, res: Response) {
    const data = await prescriptionService.create(req.user!.id, req.user!.role, req.body);
    return ApiResponse.success(res, 201, "Prescription created", data);
  }

  public async listMine(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number };
    const data = await prescriptionService.listMine(req.user!.id, req.user!.role, query);
    return ApiResponse.success(res, 200, "Prescriptions fetched", data, data.meta);
  }

  public async getById(req: Request, res: Response) {
    const data = await prescriptionService.getById(
      req.user!.id,
      req.user!.role,
      String(req.params.prescriptionId),
    );
    return ApiResponse.success(res, 200, "Prescription fetched", data);
  }

  public async generatePdf(req: Request, res: Response) {
    const data = await prescriptionService.generatePdf(
      req.user!.id,
      req.user!.role,
      String(req.params.prescriptionId),
    );
    return ApiResponse.success(res, 200, "Prescription PDF generated", data);
  }

  public async share(req: Request, res: Response) {
    const data = await prescriptionService.sharePrescription(
      req.user!.id,
      req.user!.role,
      String(req.params.prescriptionId),
      req.body,
    );
    return ApiResponse.success(res, 200, "Prescription shared", data);
  }
}

export const prescriptionController = new PrescriptionController();
