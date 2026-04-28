import { Role, type Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";

interface MilestoneItem {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  updatedAt: string;
}

export interface CreateTreatmentPlanPayload {
  clientId: string;
  assessmentId: string;
  goals: string;
  milestones: Array<{
    id?: string;
    title: string;
    description?: string;
    progress?: number;
  }>;
  startDate: Date;
  endDate?: Date;
}

export class TreatmentPlanService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(userId: string, userRole: string, payload: CreateTreatmentPlanPayload) {
    this.ensureRole(userRole, Role.THERAPIST);

    const db = await this.db();

    const [client, assessment, existing] = await Promise.all([
      db.client.findUnique({ where: { id: payload.clientId }, select: { id: true } }),
      db.assessment.findUnique({
        where: { id: payload.assessmentId },
        select: { id: true, clientId: true },
      }),
      db.treatmentPlan.findUnique({
        where: { assessmentId: payload.assessmentId },
        select: { id: true },
      }),
    ]);

    if (client === null) {
      throw ApiError.notFound("Client profile");
    }

    if (assessment === null || assessment.clientId !== payload.clientId) {
      throw ApiError.badRequest("Assessment does not belong to the selected client");
    }

    if (existing !== null) {
      throw ApiError.conflict("A treatment plan already exists for this assessment");
    }

    const milestones = this.normalizeMilestones(payload.milestones);

    const treatmentPlan = await db.treatmentPlan.create({
      data: {
        clientId: payload.clientId,
        therapistId: userId,
        assessmentId: payload.assessmentId,
        goals: payload.goals.trim(),
        milestones: milestones as unknown as Prisma.InputJsonValue,
        status: "active",
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
      },
      include: {
        client: { select: { id: true, user: { select: { name: true, email: true } } } },
        therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    return { treatmentPlan };
  }

  public async listMine(userId: string, userRole: string, options: { page?: number; limit?: number }) {
    if (userRole === Role.CLIENT) {
      return this.listByClient(userId, options);
    }

    if (userRole === Role.THERAPIST) {
      return this.listByTherapist(userId, options);
    }

    throw ApiError.forbidden("Unsupported role for this endpoint");
  }

  public async getById(userId: string, userRole: string, planId: string) {
    const db = await this.db();

    const plan = await db.treatmentPlan.findUnique({
      where: { id: planId },
      include: {
        client: { select: { id: true, user: { select: { name: true, email: true } } } },
        therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
        assessment: {
          select: {
            id: true,
            score: true,
            severity: true,
            completedAt: true,
          },
        },
      },
    });

    if (plan === null) {
      throw ApiError.notFound("Treatment plan");
    }

    const canAccess =
      userRole === Role.ADMIN ||
      (userRole === Role.CLIENT && plan.clientId === userId) ||
      (userRole === Role.THERAPIST && plan.therapistId === userId);

    if (canAccess === false) {
      throw ApiError.forbidden("You cannot access this treatment plan");
    }

    return { treatmentPlan: plan };
  }

  public async updateMilestoneProgress(
    userId: string,
    userRole: string,
    planId: string,
    milestoneId: string,
    payload: { progress: number; note?: string },
  ) {
    const db = await this.db();

    const plan = await db.treatmentPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        clientId: true,
        therapistId: true,
        milestones: true,
        status: true,
      },
    });

    if (plan === null) {
      throw ApiError.notFound("Treatment plan");
    }

    const canEdit =
      userRole === Role.ADMIN ||
      (userRole === Role.THERAPIST && plan.therapistId === userId) ||
      (userRole === Role.CLIENT && plan.clientId === userId);

    if (canEdit === false) {
      throw ApiError.forbidden("You cannot update this treatment plan");
    }

    const milestones = this.parseMilestones(plan.milestones);
    const milestoneIndex = milestones.findIndex((item) => item.id === milestoneId);

    if (milestoneIndex < 0) {
      throw ApiError.notFound("Milestone");
    }

    const progress = Math.max(0, Math.min(100, payload.progress));

    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      progress,
      status: progress >= 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : "PENDING",
      description: payload.note ?? milestones[milestoneIndex].description,
      updatedAt: new Date().toISOString(),
    };

    const allCompleted = milestones.every((item) => item.progress >= 100);

    const updatedPlan = await db.treatmentPlan.update({
      where: { id: planId },
      data: {
        milestones: milestones as unknown as Prisma.InputJsonValue,
        status: allCompleted ? "completed" : "active",
      },
    });

    return {
      treatmentPlan: updatedPlan,
      progress: {
        completedMilestones: milestones.filter((item) => item.progress >= 100).length,
        totalMilestones: milestones.length,
        completionPercent:
          milestones.length === 0
            ? 0
            : Math.round(
                (milestones.reduce((acc, item) => acc + item.progress, 0) /
                  (milestones.length * 100)) *
                  100,
              ),
      },
    };
  }

  public async updatePlanStatus(
    userId: string,
    userRole: string,
    planId: string,
    payload: { status: "active" | "paused" | "completed" },
  ) {
    if (userRole !== Role.THERAPIST && userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only therapist or admin can update plan status");
    }

    const db = await this.db();

    const plan = await db.treatmentPlan.findUnique({
      where: { id: planId },
      select: { id: true, therapistId: true },
    });

    if (plan === null) {
      throw ApiError.notFound("Treatment plan");
    }

    if (userRole === Role.THERAPIST && plan.therapistId !== userId) {
      throw ApiError.forbidden("You can only update your own treatment plans");
    }

    const updated = await db.treatmentPlan.update({
      where: { id: planId },
      data: { status: payload.status },
    });

    return { treatmentPlan: updated };
  }

  private async listByClient(clientId: string, options: { page?: number; limit?: number }) {
    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.treatmentPlan.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.treatmentPlan.count({ where: { clientId } }),
    ]);

    return {
      treatmentPlans: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async listByTherapist(therapistId: string, options: { page?: number; limit?: number }) {
    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.treatmentPlan.findMany({
        where: { therapistId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.treatmentPlan.count({ where: { therapistId } }),
    ]);

    return {
      treatmentPlans: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private normalizeMilestones(
    milestones: Array<{ id?: string; title: string; description?: string; progress?: number }>,
  ): MilestoneItem[] {
    if (milestones.length === 0) {
      throw ApiError.badRequest("At least one milestone is required");
    }

    const now = new Date().toISOString();

    return milestones.map((milestone, index) => {
      const progress = Math.max(0, Math.min(100, milestone.progress ?? 0));
      return {
        id: milestone.id?.trim() || `ms_${index + 1}_${Date.now()}`,
        title: milestone.title.trim(),
        description: milestone.description?.trim(),
        progress,
        status: progress >= 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : "PENDING",
        updatedAt: now,
      };
    });
  }

  private parseMilestones(raw: Prisma.JsonValue): MilestoneItem[] {
    if (Array.isArray(raw)) {
      return raw as unknown as MilestoneItem[];
    }

    throw ApiError.badRequest("Milestones are not in expected array format");
  }

  private ensureRole(actualRole: string, expectedRole: Role) {
    if (actualRole !== expectedRole) {
      throw ApiError.forbidden(`Only ${expectedRole.toLowerCase()}s can perform this action`);
    }
  }
}

export const treatmentPlanService = new TreatmentPlanService();
