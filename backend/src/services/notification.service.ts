import {
  NotificationChannel,
  NotificationType,
  SessionStatus,
  type Prisma,
} from "@prisma/client";
import { DatabaseService } from "../config/database";
import { Role } from "../constants/roles";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
  clientId?: string | null;
}

export interface ListNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export class NotificationService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async sendToUser(input: SendNotificationInput) {
    const db = await this.db();

    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw ApiError.notFound("Notification recipient user");
    }

    const notification = await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: input.channel,
        title: input.title.trim(),
        message: input.message.trim(),
        metadata: input.metadata,
        clientId: input.clientId ?? null,
      },
    });

    // placeholder for provider integrations (push/email/sms)
    logger.info("Notification queued", {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      channel: notification.channel,
    });

    return { notification };
  }

  public async sendToUsers(input: {
    userIds: string[];
    type: NotificationType;
    channels: NotificationChannel[];
    title: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
    clientId?: string | null;
  }) {
    const db = await this.db();
    const uniqueUserIds = [...new Set(input.userIds.filter(Boolean))];

    if (!uniqueUserIds.length) {
      return { count: 0 };
    }

    const users = await db.user.findMany({
      where: { id: { in: uniqueUserIds }, isActive: true },
      select: { id: true },
    });

    if (!users.length) {
      return { count: 0 };
    }

    const payloads: Array<Prisma.NotificationCreateManyInput> = [];

    users.forEach((user) => {
      input.channels.forEach((channel) => {
        payloads.push({
          userId: user.id,
          type: input.type,
          channel,
          title: input.title.trim(),
          message: input.message.trim(),
          metadata: input.metadata,
          clientId: input.clientId ?? null,
        });
      });
    });

    const result = await db.notification.createMany({ data: payloads });

    logger.info("Bulk notifications queued", {
      requestedUsers: uniqueUserIds.length,
      deliveredUsers: users.length,
      channels: input.channels,
      createdRows: result.count,
      type: input.type,
    });

    return {
      count: result.count,
      deliveredUsers: users.length,
    };
  }

  public async listForUser(userId: string, options: ListNotificationsOptions = {}) {
    const db = await this.db();

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        unreadCount,
      },
    };
  }

  public async markRead(userId: string, notificationId: string) {
    const db = await this.db();

    const notification = await db.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== userId) {
      throw ApiError.notFound("Notification");
    }

    if (notification.isRead) {
      return { notification };
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { notification: updated };
  }

  public async markAllRead(userId: string) {
    const db = await this.db();

    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  public async sendSessionReminders(
    userRole: string,
    options: { withinHours?: number; channels?: NotificationChannel[] } = {},
  ) {
    this.ensureAdmin(userRole);

    const db = await this.db();
    const withinHours = Math.min(72, Math.max(1, options.withinHours ?? 24));
    const channels = options.channels?.length
      ? options.channels
      : [NotificationChannel.PUSH, NotificationChannel.EMAIL];

    const now = new Date();
    const horizon = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

    const upcoming = await db.session.findMany({
      where: {
        status: SessionStatus.CONFIRMED,
        scheduledAt: {
          gte: now,
          lte: horizon,
        },
      },
      select: {
        id: true,
        clientId: true,
        therapistId: true,
        scheduledAt: true,
        type: true,
      },
      take: 300,
    });

    if (!upcoming.length) {
      return { sessions: 0, notifications: 0 };
    }

    let notifications = 0;

    for (const session of upcoming) {
      const when = session.scheduledAt.toISOString();
      const title = "Session Reminder";
      const baseMessage = `Your ${session.type.toLowerCase()} session is scheduled at ${when}`;

      const [clientResult, therapistResult] = await Promise.all([
        this.sendToUsers({
          userIds: [session.clientId],
          type: NotificationType.SESSION_REMINDER,
          channels,
          title,
          message: baseMessage,
          metadata: {
            sessionId: session.id,
            scheduledAt: session.scheduledAt.toISOString(),
            role: Role.CLIENT,
          },
          clientId: session.clientId,
        }),
        this.sendToUsers({
          userIds: [session.therapistId],
          type: NotificationType.SESSION_REMINDER,
          channels,
          title,
          message: `Upcoming session with client at ${when}`,
          metadata: {
            sessionId: session.id,
            scheduledAt: session.scheduledAt.toISOString(),
            role: Role.THERAPIST,
          },
          clientId: session.clientId,
        }),
      ]);

      notifications += clientResult.count + therapistResult.count;
    }

    return {
      sessions: upcoming.length,
      notifications,
      withinHours,
      channels,
    };
  }

  public async sendPaymentUpdate(
    userRole: string,
    payload: {
      paymentId: string;
      title?: string;
      message?: string;
      channels?: NotificationChannel[];
    },
  ) {
    this.ensureAdmin(userRole);

    const db = await this.db();

    const payment = await db.payment.findUnique({
      where: { id: payload.paymentId },
      select: {
        id: true,
        clientId: true,
        sessionId: true,
        status: true,
        amount: true,
        currency: true,
      },
    });

    if (!payment) {
      throw ApiError.notFound("Payment");
    }

    const channels = payload.channels?.length
      ? payload.channels
      : [NotificationChannel.PUSH, NotificationChannel.EMAIL];

    const result = await this.sendToUsers({
      userIds: [payment.clientId],
      type: NotificationType.PAYMENT_UPDATE,
      channels,
      title: payload.title ?? "Payment Update",
      message:
        payload.message ??
        `Payment ${payment.status.toLowerCase()} for ${payment.currency} ${payment.amount.toFixed(2)}`,
      metadata: {
        paymentId: payment.id,
        sessionId: payment.sessionId,
        status: payment.status,
      },
      clientId: payment.clientId,
    });

    return { ...result, payment };
  }

  public async sendCrisisAlert(payload: {
    clientId: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    summary: string;
    source: string;
  }) {
    const db = await this.db();

    const [clientUser, adminUsers] = await Promise.all([
      db.user.findUnique({ where: { id: payload.clientId }, select: { id: true, isActive: true } }),
      db.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      }),
    ]);

    if (!clientUser || !clientUser.isActive) {
      throw ApiError.notFound("Client user");
    }

    const clientChannels =
      payload.riskLevel === "CRITICAL"
        ? [NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.SMS]
        : [NotificationChannel.PUSH, NotificationChannel.EMAIL];

    const adminChannels =
      payload.riskLevel === "CRITICAL"
        ? [NotificationChannel.PUSH, NotificationChannel.EMAIL]
        : [NotificationChannel.PUSH];

    const [toClient, toAdmins] = await Promise.all([
      this.sendToUsers({
        userIds: [payload.clientId],
        type: NotificationType.CRISIS_ALERT,
        channels: clientChannels,
        title: "Wellness Safety Check",
        message:
          payload.riskLevel === "CRITICAL"
            ? "Urgent support resources are available now. Please contact emergency support if you are unsafe."
            : "We noticed signs of distress. Your care team can help if you need support.",
        metadata: {
          riskLevel: payload.riskLevel,
          source: payload.source,
          summary: payload.summary,
        },
        clientId: payload.clientId,
      }),
      this.sendToUsers({
        userIds: adminUsers.map((a) => a.id),
        type: NotificationType.CRISIS_ALERT,
        channels: adminChannels,
        title: `Crisis Alert (${payload.riskLevel})`,
        message: payload.summary,
        metadata: {
          riskLevel: payload.riskLevel,
          clientId: payload.clientId,
          source: payload.source,
        },
        clientId: payload.clientId,
      }),
    ]);

    return {
      clientNotifications: toClient.count,
      adminNotifications: toAdmins.count,
      adminsNotified: adminUsers.length,
    };
  }

  public async getAdminSummary(userRole: string) {
    this.ensureAdmin(userRole);
    const db = await this.db();

    const [totalsByType, unread, sentToday] = await Promise.all([
      db.notification.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      db.notification.count({ where: { isRead: false } }),
      db.notification.count({
        where: {
          sentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      unread,
      sentToday,
      byType: totalsByType.map((row) => ({ type: row.type, count: row._count._all })),
    };
  }

  private ensureAdmin(userRole: string) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can perform this action");
    }
  }
}

export const notificationService = new NotificationService();
