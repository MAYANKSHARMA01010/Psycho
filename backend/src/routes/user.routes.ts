import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { UploadMiddleware } from "../middlewares/upload";
import { userController } from "../controllers/user.controller";
import { Routes } from "../interfaces/route.interface";
import { updateProfileSchema } from "../validators/user.validation";

export default class UserRoutes implements Routes {
  public path = "/api/v1/users";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/me",
      AuthMiddleware.authenticate,
      AsyncUtils.wrap(userController.getMe.bind(userController)),
    );

    this.router.patch(
      "/me",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(updateProfileSchema),
      AsyncUtils.wrap(userController.updateMe.bind(userController)),
    );

    this.router.post(
      "/me/avatar",
      AuthMiddleware.authenticate,
      UploadMiddleware.single("file"),
      AsyncUtils.wrap(userController.uploadAvatar.bind(userController)),
    );

    this.router.delete(
      "/me/avatar",
      AuthMiddleware.authenticate,
      AsyncUtils.wrap(userController.removeAvatar.bind(userController)),
    );
  }
}
