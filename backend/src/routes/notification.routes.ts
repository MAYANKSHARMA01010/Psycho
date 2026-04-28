import { Router } from "express";
import { Routes } from "../interfaces/route.interface";
import { AsyncUtils } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../middlewares/validate";
import { Role } from "../constants/roles";
import { notificationController } from "../controllers/notification.controller";
import {
  notificationIdParamSchema,
  listNotificationQuerySchema,
  sendNotificationSchema,
  sendSessionRemindersSchema,
  sendPaymentUpdateSchema,
  sendCrisisAlertSchema,
} from "../validators/notification.validation";

export default class NotificationRoutes implements Routes {
  public path = "/api/v1";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/notifications/me",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(listNotificationQuerySchema),
      AsyncUtils.wrap(notificationController.listMine.bind(notificationController)),
    );

    this.router.patch(
      "/notifications/:notificationId/read",
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(notificationIdParamSchema),
      AsyncUtils.wrap(notificationController.markRead.bind(notificationController)),
    );

    this.router.patch(
      "/notifications/read-all",
      AuthMiddleware.authenticate,
      AsyncUtils.wrap(notificationController.markAllRead.bind(notificationController)),
    );

    this.router.post(
      "/admin/notifications/send",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate(sendNotificationSchema),
      AsyncUtils.wrap(notificationController.sendCustom.bind(notificationController)),
    );

    this.router.post(
      "/admin/notifications/session-reminders",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate(sendSessionRemindersSchema),
      AsyncUtils.wrap(notificationController.sendSessionReminders.bind(notificationController)),
    );

    this.router.post(
      "/admin/notifications/payment-update",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate(sendPaymentUpdateSchema),
      AsyncUtils.wrap(notificationController.sendPaymentUpdate.bind(notificationController)),
    );

    this.router.post(
      "/admin/notifications/crisis-alert",
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(Role.ADMIN),
      ValidationMiddleware.validate(sendCrisisAlertSchema),
      AsyncUtils.wrap(notificationController.sendCrisisAlert.bind(notificationController)),
    );
  }
}
