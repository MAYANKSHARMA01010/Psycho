import multer from "multer";
import { Request } from "express";
import { ApiError } from "../utils/ApiError";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

export class UploadMiddleware {
  private static memoryUploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 5 },
    fileFilter,
  });

  public static single(field: string) {
    return UploadMiddleware.memoryUploader.single(field);
  }

  public static array(field: string, maxCount = 5) {
    return UploadMiddleware.memoryUploader.array(field, maxCount);
  }
}
