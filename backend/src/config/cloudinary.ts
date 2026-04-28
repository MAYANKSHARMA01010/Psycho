import { v2 as cloudinary, ConfigOptions } from "cloudinary";
import { env } from "./env";
import { logger } from "../utils/logger";

export class CloudinaryConfig {
  private static configured = false;

  public static getInstance() {
    if (!CloudinaryConfig.configured) {
      CloudinaryConfig.configure();
    }
    return cloudinary;
  }

  public static isConfigured(): boolean {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
    );
  }

  private static configure() {
    if (!CloudinaryConfig.isConfigured()) {
      logger.warn("Cloudinary credentials missing — file uploads will fail at runtime");
      return;
    }

    const options: ConfigOptions = {
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    };
    cloudinary.config(options);
    CloudinaryConfig.configured = true;
  }
}
