import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { UploadMiddleware } from "../middlewares/upload";
import { uploadController } from "../controllers/upload.controller";
import { Routes } from "../interfaces/route.interface";

export default class UploadRoutes implements Routes {
  public path = "/api/v1/uploads";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/",
      AuthMiddleware.authenticate,
      UploadMiddleware.single("file"),
      AsyncUtils.wrap(uploadController.upload.bind(uploadController)),
    );
  }
}
