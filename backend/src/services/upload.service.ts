import { CloudinaryConfig } from "../config/cloudinary";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export type UploadCategory = "avatar" | "certificate" | "id_proof" | "prescription" | "misc";

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
  originalFilename?: string;
}

export interface UploadOptions {
  category: UploadCategory;
  ownerId: string;
  filename?: string;
  resourceType?: "image" | "raw" | "auto";
  contentType?: string;
}

export class UploadService {
  public async uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    if (!CloudinaryConfig.isConfigured()) {
      throw ApiError.internal("File upload is not configured. Cloudinary credentials missing.");
    }

    const cloudinary = CloudinaryConfig.getInstance();
    const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${options.category}/${options.ownerId}`;
    const resourceType = options.resourceType ?? this.inferResourceType(options.contentType);

    return new Promise<UploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: Boolean(options.filename),
          unique_filename: true,
          overwrite: false,
          filename_override: options.filename,
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              ApiError.internal(`Upload failed: ${error?.message ?? "unknown error"}`),
            );
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            bytes: result.bytes,
            format: result.format,
            originalFilename: options.filename,
          });
        },
      );
      stream.end(buffer);
    });
  }

  public async destroy(publicId: string, resourceType: "image" | "raw" | "video" = "image"): Promise<void> {
    if (!CloudinaryConfig.isConfigured()) return;
    const cloudinary = CloudinaryConfig.getInstance();
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  private inferResourceType(contentType?: string): "image" | "raw" | "auto" {
    if (!contentType) return "auto";
    if (contentType.startsWith("image/")) return "image";
    if (contentType === "application/pdf") return "raw";
    return "auto";
  }
}

export const uploadService = new UploadService();
