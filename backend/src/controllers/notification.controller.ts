import { type Request, type Response } from "express";
import { NotificationChannel, NotificationType } from "@prisma/client";
import { ApiResponse } from "../utils/ApiResponse";
import { notificationService } from "../services/notification.service";

export class NotificationController {
  public async listMine(req: Request, res: Response) {
    const query = req.query as { page?: number; limit?: number; unreadOnly?: boolean };
    const data = await notificationService.listForUser(req.user!.id, query);
    return ApiResponse.success(res, 200, "Notifications fetched", data, data.meta);
  }

  public async markRead(req: Request, res: Response) {
    const data = await notificationService.markRead(req.user!.id, String(req.params.notificationId));
    return ApiResponse.success(res, 200, "Notification marked as read", data);
  }

  public async markAllRead(req: Request, res: Response) {
    const data = await notificationService.markAllRead(req.user!.id);
    return ApiResponse.success(res, 200, "All notifications marked as read", data);
  }

  public async sendCustom(req: Request, res: Response) {
    const body = req.body as {
      userIds: string[];
      type: NotificationType;
      channels: NotificationChannel[];
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
      clientId?: string;
    };

    const data = await notificationService.sendToUsers({
      userIds: body.userIds,
      type: body.type,
      channels: body.channels,
      title: body.title,
      message: body.message,
      metadata: body.metadata as any,
      clientId: body.clientId,
    });

    return ApiResponse.success(res, 201, "Notifications sent", data);
  }

  public async sendSessionReminders(req: Request, res: Response) {
    const body = req.body as { withinHours?: number; channels?: NotificationChannel[] };
    const data = await notificationService.sendSessionReminders(req.user!.role, body);
    return ApiResponse.success(res, 200, "Session reminders sent", data);
  }

  public async sendPaymentUpdate(req: Request, res: Response) {
    const data = await notificationService.sendPaymentUpdate(req.user!.role, req.body);
    return ApiResponse.success(res, 200, "Payment update notifications sent", data);
  }

  public async sendCrisisAlert(req: Request, res: Response) {
    const data = await notificationService.sendCrisisAlert(req.body);
    return ApiResponse.success(res, 200, "Crisis alerts sent", data);
  }
}

export const notificationController = new NotificationController();
