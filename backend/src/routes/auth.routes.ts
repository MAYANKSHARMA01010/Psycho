import { Router } from "express";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { authController } from "../controllers/auth.controller";
import { Routes } from "../interfaces/route.interface";

export default class AuthRoutes implements Routes {
  public path = "/api/v1/auth";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/google/start", AsyncUtils.wrap(authController.googleStart.bind(authController)));
    this.router.get("/google/callback", AsyncUtils.wrap(authController.googleCallback.bind(authController)));

    this.router.post("/login", AsyncUtils.wrap(authController.login.bind(authController)));
    this.router.post("/refresh", AsyncUtils.wrap(authController.refresh.bind(authController)));
    this.router.post("/logout", AsyncUtils.wrap(authController.logout.bind(authController)));

    this.router.post("/forgot-password", AsyncUtils.wrap(authController.forgotPassword.bind(authController)));
    this.router.post("/reset-password", AsyncUtils.wrap(authController.resetPassword.bind(authController)));

    this.router.post(
      "/change-password",
      AuthMiddleware.authenticate,
      AsyncUtils.wrap(authController.changePassword.bind(authController)),
    );

    this.router.get(
      "/me",
      AuthMiddleware.authenticate,
      AsyncUtils.wrap(authController.me.bind(authController)),
    );
  }
}
