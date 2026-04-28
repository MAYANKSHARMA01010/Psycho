import { ComplaintStatus, NotificationChannel, NotificationType, Role } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export interface RaiseComplaintPayload {
  againstId: string;
  description: string;
}

export interface ReviewComplaintPayload {
  action: "under_review" | "resolve" | "dismiss" | "escalate";
  resolution?: string;
}

export class ComplaintService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async raise(userId: string, userRole: string, payload: RaiseComplaintPayload) {
    if (userRole !== Role.CLIENT && userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only clients or therapists can raise complaints");
    }

    const db = await this.db();

    if (userId === payload.againstId) {
      throw ApiError.badRequest("You cannot raise a complaint against yourself");
    }

    const againstUser = await db.user.findUnique({
      where: { id: payload.againstId },
      select: { id: true, role: true, isActive: true },
    });

    if (againstUser === null || againstUser.isActive === false) {
      throw ApiError.notFound("User to complain against");
    }

    const complaint = await db.complaint.create({
      data: {
        raisedById: userId,
        againstId: payload.againstId,
        description: payload.description.trim(),
        clientId:
          userRole === Role.CLIENT
            ? userId
            : againstUser.role === Role.CLIENT
              ? againstUser.id
              : null,
        therapistId:
          userRole === Role.THERAPIST
            ? userId
            : againstUser.role === Role.THERAPIST
              ? againstUser.id
              : null,
      },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
        against: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const adminUsers = await db.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
      take: 50,
    });

    await notificationService.sendToUsers({
      userIds: adminUsers.map((user) => user.id),
      type: NotificationType.COMPLAINT_UPDATE,
      channels: [NotificationChannel.PUSH],
      title: "New Complaint Raised",
      message: `Complaint ${complaint.id} raised by ${complaint.raisedBy.name} against ${complaint.against.name}`,
      metadata: {
        complaintId: complaint.id,
        raisedById: complaint.raisedById,
        againstId: complaint.againstId,
      },
      clientId: complaint.clientId,
    });

    return { complaint };
  }

  public async listMine(
    userId: string,
    userRole: string,
    options: {
      page?: number;
      limit?: number;
      scope?: "raised" | "against" | "all";
      status?: ComplaintStatus;
    },
  ) {
    if (userRole !== Role.CLIENT && userRole !== Role.THERAPIST && userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Unsupported role for complaint list");
    }

    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const where =
      userRole === Role.ADMIN
        ? {
            ...(options.status ? { status: options.status } : {}),
          }
        : {
            ...(options.status ? { status: options.status } : {}),
            ...(options.scope === "raised"
              ? { raisedById: userId }
              : options.scope === "against"
                ? { againstId: userId }
                : {
                    OR: [{ raisedById: userId }, { againstId: userId }],
                  }),
          };

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          raisedBy: { select: { id: true, name: true, email: true, role: true } },
          against: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.complaint.count({ where }),
    ]);

    return {
      complaints,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  public async getById(userId: string, userRole: string, complaintId: string) {
    const db = await this.db();

    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
        against: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (complaint === null) {
      throw ApiError.notFound("Complaint");
    }

    const canAccess =
      userRole === Role.ADMIN || complaint.raisedById === userId || complaint.againstId === userId;

    if (canAccess === false) {
      throw ApiError.forbidden("You cannot access this complaint");
    }

    return { complaint };
  }

  public async reviewByAdmin(
    adminId: string,
    userRole: string,
    complaintId: string,
    payload: ReviewComplaintPayload,
  ) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can review complaints");
    }

    const db = await this.db();

    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
        against: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (complaint === null) {
      throw ApiError.notFound("Complaint");
    }

    const resolutionText = payload.resolution?.trim();

    let nextStatus: ComplaintStatus = complaint.status;
    let nextResolution: string | null = complaint.resolution;
    let resolvedAt: Date | null = complaint.resolvedAt;

    if (payload.action === "under_review") {
      nextStatus = ComplaintStatus.UNDER_REVIEW;
      nextResolution = null;
      resolvedAt = null;
    }

    if (payload.action === "resolve") {
      if (!resolutionText) {
        throw ApiError.badRequest("Resolution notes are required to resolve complaint");
      }
      nextStatus = ComplaintStatus.RESOLVED;
      nextResolution = resolutionText;
      resolvedAt = new Date();
    }

    if (payload.action === "dismiss") {
      if (!resolutionText) {
        throw ApiError.badRequest("Resolution notes are required to dismiss complaint");
      }
      nextStatus = ComplaintStatus.DISMISSED;
      nextResolution = resolutionText;
      resolvedAt = new Date();
    }

    if (payload.action === "escalate") {
      nextStatus = ComplaintStatus.UNDER_REVIEW;
      nextResolution = resolutionText
        ? `Escalated by admin ${adminId}: ${resolutionText}`
        : `Escalated by admin ${adminId}`;
      resolvedAt = null;
    }

    const updated = await db.complaint.update({
      where: { id: complaintId },
      data: {
        status: nextStatus,
        resolution: nextResolution,
        resolvedAt,
      },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
        against: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await notificationService.sendToUsers({
      userIds: [updated.raisedById, updated.againstId],
      type: NotificationType.COMPLAINT_UPDATE,
      channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
      title: "Complaint Status Updated",
      message: `Complaint ${updated.id} is now ${updated.status}`,
      metadata: {
        complaintId: updated.id,
        status: updated.status,
        resolution: updated.resolution,
      },
      clientId: updated.clientId,
    });

    if (payload.action === "escalate" && updated.clientId) {
      await notificationService.sendCrisisAlert({
        clientId: updated.clientId,
        riskLevel: "HIGH",
        summary: `Complaint ${updated.id} was escalated by admin for urgent review`,
        source: "complaint-escalation",
      });
    }

    return { complaint: updated };
  }
}

export const complaintService = new ComplaintService();
