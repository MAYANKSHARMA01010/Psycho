import { Role, type Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { crisisMonitoringService } from "./crisisMonitoring.service";
import { notificationService } from "./notification.service";

export interface SubmitAssessmentPayload {
  responses: Prisma.InputJsonValue;
  completedAt?: Date;
}

export class AssessmentService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async submit(userId: string, userRole: string, payload: SubmitAssessmentPayload) {
    this.ensureRole(userRole, Role.CLIENT);

    const db = await this.db();

    const client = await db.client.findUnique({ where: { id: userId }, select: { id: true } });
    if (!client) {
      throw ApiError.notFound("Client profile");
    }

    const score = this.calculateScore(payload.responses);
    const severity = this.computeSeverity(score);

    const assessment = await db.assessment.create({
      data: {
        clientId: userId,
        responses: payload.responses,
        score,
        severity,
        completedAt: payload.completedAt ?? new Date(),
      },
    });

    const crisisEvaluation = crisisMonitoringService.evaluateAssessmentRisk(
      payload.responses,
      score,
      severity,
    );

    await crisisMonitoringService.persistAssessmentSignal({
      clientId: userId,
      responses: payload.responses,
      score,
      riskLevel: crisisEvaluation.riskLevel,
      crisisFlag: crisisEvaluation.crisisFlag,
      summary: crisisEvaluation.summary,
    });

    const [crisisAlertResult] = await Promise.all([
      crisisMonitoringService.handleAssessmentRiskAlert({
        clientId: userId,
        riskLevel: crisisEvaluation.riskLevel,
        crisisFlag: crisisEvaluation.crisisFlag,
        summary: crisisEvaluation.summary,
      }),
      notificationService.sendToUsers({
        userIds: [userId],
        type: "AI_NUDGE",
        channels: ["PUSH"],
        title: "Assessment Submitted",
        message:
          crisisEvaluation.crisisFlag
            ? "Your assessment indicates elevated stress. A care coordinator may follow up shortly."
            : "Thanks for completing your assessment. Keep tracking regularly.",
        metadata: {
          assessmentId: assessment.id,
          score,
          severity,
        },
        clientId: userId,
      }),
    ]);

    return {
      assessment,
      analytics: {
        score,
        severity,
      },
      risk: {
        riskLevel: crisisEvaluation.riskLevel,
        crisisFlag: crisisEvaluation.crisisFlag,
        signals: crisisEvaluation.signals,
      },
      alerts: crisisAlertResult,
    };
  }

  public async getMine(userId: string, userRole: string, options: { page?: number; limit?: number }) {
    this.ensureRole(userRole, Role.CLIENT);
    return this.listForClient(userId, options);
  }

  public async listForClient(clientId: string, options: { page?: number; limit?: number }) {
    const db = await this.db();

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      db.assessment.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.assessment.count({ where: { clientId } }),
    ]);

    return {
      assessments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  public async getById(
    requesterId: string,
    requesterRole: string,
    assessmentId: string,
  ) {
    const db = await this.db();

    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        client: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!assessment) {
      throw ApiError.notFound("Assessment");
    }

    const canAccess =
      requesterRole === Role.ADMIN ||
      (requesterRole === Role.CLIENT && assessment.clientId === requesterId) ||
      requesterRole === Role.THERAPIST;

    if (!canAccess) {
      throw ApiError.forbidden("You cannot access this assessment");
    }

    return { assessment };
  }

  public async getClientAssessments(
    requesterRole: string,
    clientId: string,
    options: { page?: number; limit?: number },
  ) {
    if (requesterRole !== Role.THERAPIST && requesterRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only therapists or admins can view client assessments");
    }

    return this.listForClient(clientId, options);
  }

  private calculateScore(responses: Prisma.InputJsonValue): number {
    const values: number[] = [];

    const collect = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        values.push(value);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }

      if (value && typeof value === "object") {
        Object.values(value as Record<string, unknown>).forEach(collect);
      }
    };

    collect(responses);

    if (!values.length) {
      throw ApiError.badRequest("Assessment responses must include numeric values for scoring");
    }

    const sum = values.reduce((acc, value) => acc + value, 0);
    const average = sum / values.length;

    let normalized = average;

    if (average <= 5) {
      normalized = average * 20;
    } else if (average <= 10) {
      normalized = average * 10;
    }

    return Math.round(Math.max(0, Math.min(100, normalized)) * 100) / 100;
  }

  private computeSeverity(score: number): string {
    if (score >= 90) return "CRITICAL";
    if (score >= 75) return "HIGH";
    if (score >= 50) return "MODERATE";
    if (score >= 25) return "MILD";
    return "LOW";
  }

  private ensureRole(actualRole: string, expectedRole: Role) {
    if (actualRole !== expectedRole) {
      throw ApiError.forbidden(`Only ${expectedRole.toLowerCase()}s can perform this action`);
    }
  }
}

export const assessmentService = new AssessmentService();
