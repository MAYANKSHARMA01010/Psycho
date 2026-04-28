import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { therapistService } from "../services/therapist.service";
import { therapistDocumentService } from "../services/therapistDocument.service";
import { DocumentType } from "../entities/Therapist";

export class TherapistController {
  public async createOwnProfile(req: Request, res: Response) {
    const data = await therapistService.createOwnProfile(
      req.user!.id,
      req.user!.role,
      req.body,
    );
    return ApiResponse.success(res, 201, "Therapist profile created", data);
  }

  public async getOwnProfile(req: Request, res: Response) {
    const data = await therapistService.getOwnProfile(req.user!.id, req.user!.role);
    return ApiResponse.success(res, 200, "Therapist profile fetched", data);
  }

  public async updateOwnProfile(req: Request, res: Response) {
    const data = await therapistService.updateOwnProfile(
      req.user!.id,
      req.user!.role,
      req.body,
    );
    return ApiResponse.success(res, 200, "Therapist profile updated", data);
  }

  public async getPublicProfile(req: Request, res: Response) {
    const data = await therapistService.getPublicProfileById(String(req.params.therapistId));
    return ApiResponse.success(res, 200, "Therapist fetched", data);
  }

  public async search(req: Request, res: Response) {
    const q = req.query as Record<string, any>;
    const data = await therapistService.search(
      {
        specialization: q.specialization,
        language: q.language,
        minRating: q.minRating,
        hasAvailability: q.hasAvailability,
        search: q.search,
      },
      {
        page: q.page,
        limit: q.limit,
        sortBy: q.sortBy,
        sortOrder: q.sortOrder,
      },
    );
    return ApiResponse.success(res, 200, "Therapists fetched", data);
  }

  public async uploadDocument(req: Request, res: Response) {
    const body = req.body as {
      type: DocumentType;
      fileUrl: string;
      fileName?: string;
      notes?: string;
    };
    const data = await therapistDocumentService.upload(req.user!.id, req.user!.role, body);
    return ApiResponse.success(res, 201, "Document uploaded", data);
  }

  public async uploadDocumentMultipart(req: Request, res: Response) {
    const body = req.body as { type: DocumentType; notes?: string };
    if (!req.file) {
      return ApiResponse.success(res, 400, "No file provided", null);
    }
    const data = await therapistDocumentService.uploadMultipart(
      req.user!.id,
      req.user!.role,
      { type: body.type, file: req.file, notes: body.notes },
    );
    return ApiResponse.success(res, 201, "Document uploaded", data);
  }

  public async listOwnDocuments(req: Request, res: Response) {
    const data = await therapistDocumentService.listOwn(req.user!.id, req.user!.role);
    return ApiResponse.success(res, 200, "Documents fetched", data);
  }

  public async deleteDocument(req: Request, res: Response) {
    await therapistDocumentService.delete(
      req.user!.id,
      req.user!.role,
      String(req.params.documentId),
    );
    return ApiResponse.success(res, 200, "Document deleted", null);
  }
}

export const therapistController = new TherapistController();
