import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { uploadService, UploadCategory } from "../services/upload.service";
import { ApiError } from "../utils/ApiError";

const ALLOWED_CATEGORIES: UploadCategory[] = [
  "avatar",
  "certificate",
  "id_proof",
  "prescription",
  "misc",
];

export class UploadController {
  public async upload(req: Request, res: Response) {
    if (!req.file) {
      throw ApiError.badRequest("No file provided. Send 'file' as multipart/form-data");
    }

    const rawCategory = ((req.body as any)?.category as string | undefined) ?? "misc";
    if (!ALLOWED_CATEGORIES.includes(rawCategory as UploadCategory)) {
      throw ApiError.badRequest(
        `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
      );
    }

    const result = await uploadService.uploadBuffer(req.file.buffer, {
      category: rawCategory as UploadCategory,
      ownerId: req.user!.id,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    return ApiResponse.success(res, 201, "File uploaded", { file: result });
  }
}

export const uploadController = new UploadController();
