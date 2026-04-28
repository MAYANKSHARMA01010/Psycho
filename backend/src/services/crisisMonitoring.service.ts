import { CrisisLevel, Role, type Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export interface CrisisEvaluationResult {
  crisisFlag: boolean;
  riskLevel: CrisisLevel;
  summary: string;
  signals: string[];
}

export class CrisisMonitoringService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public evaluateAssessmentRisk(
    responses: Prisma.InputJsonValue,
    score: number,
    severity: string,
  ): CrisisEvaluationResult {
    const signals: string[] = [];

    const flattened = this.flattenValues(responses);
    const normalizedSeverity = severity.toUpperCase();

    const criticalKeywords = [
      "suicid",
      "self harm",
      "self-harm",
      "kill myself",
      "end my life",
      "unsafe",
      "abuse",
      "overdose",
    ];

    const highKeywords = [
      "panic",
      "hopeless",
      "worthless",
      "extreme anxiety",
      "severe depression",
    ];

    const matchesCriticalKeyword = flattened.strings.some((value) =>
      criticalKeywords.some((keyword) => value.includes(keyword)),
    );

    const matchesHighKeyword = flattened.strings.some((value) =>
      highKeywords.some((keyword) => value.includes(keyword)),
    );

    const hasSelfHarmBoolSignal = flattened.booleans.some(
      (entry) => entry.value && /(suicid|self.?harm|unsafe|harm.*self|kill)/i.test(entry.key),
    );

    if (normalizedSeverity === "CRITICAL") {
      signals.push("critical-severity");
    }
    if (normalizedSeverity === "HIGH") {
      signals.push("high-severity");
    }
    if (matchesCriticalKeyword) {
      signals.push("critical-keywords");
    }
    if (hasSelfHarmBoolSignal) {
      signals.push("self-harm-bool-signal");
    }
    if (matchesHighKeyword) {
      signals.push("high-distress-keywords");
    }
    if (score >= 90) {
      signals.push("very-high-score");
    }

    let riskLevel: CrisisLevel = CrisisLevel.LOW;

    if (
      normalizedSeverity === "CRITICAL" ||
      hasSelfHarmBoolSignal ||
      matchesCriticalKeyword ||
      score >= 90
    ) {
      riskLevel = CrisisLevel.CRITICAL;
    } else if (normalizedSeverity === "HIGH" || matchesHighKeyword || score >= 75) {
      riskLevel = CrisisLevel.HIGH;
    } else if (normalizedSeverity === "MODERATE" || score >= 50) {
      riskLevel = CrisisLevel.MEDIUM;
    }

    const crisisFlag = riskLevel === CrisisLevel.HIGH || riskLevel === CrisisLevel.CRITICAL;

    const summary = crisisFlag
      ? `Detected ${riskLevel.toLowerCase()} mental-health risk from assessment signals: ${
          signals.join(", ") || "none"
        }`
      : `Assessment risk level ${riskLevel.toLowerCase()} with no crisis flag`;

    return { crisisFlag, riskLevel, summary, signals };
  }

  public async persistAssessmentSignal(payload: {
    clientId: string;
    responses: Prisma.InputJsonValue;
    score: number;
    riskLevel: CrisisLevel;
    crisisFlag: boolean;
    summary: string;
  }) {
    const db = await this.db();

    const interaction = await db.aIInteraction.create({
      data: {
        clientId: payload.clientId,
        inputText: JSON.stringify(payload.responses),
        responseText: payload.summary,
        moodScore: Math.max(0, Math.min(100, 100 - payload.score)),
        crisisFlag: payload.crisisFlag,
        crisisLevel: payload.crisisFlag ? payload.riskLevel : null,
      },
    });

    return { interaction };
  }

  public async handleAssessmentRiskAlert(payload: {
    clientId: string;
    riskLevel: CrisisLevel;
    crisisFlag: boolean;
    summary: string;
  }) {
    if (!payload.crisisFlag) {
      return { triggered: false };
    }

    const result = await notificationService.sendCrisisAlert({
      clientId: payload.clientId,
      riskLevel: payload.riskLevel,
      summary: payload.summary,
      source: "assessment",
    });

    return {
      triggered: true,
      ...result,
    };
  }

  public async getHighRiskUsers(
    userRole: string,
    options: { days?: number; limit?: number } = {},
  ) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can view high-risk users");
    }

    const db = await this.db();
    const days = Math.min(90, Math.max(1, options.days ?? 30));
    const limit = Math.min(200, Math.max(1, options.limit ?? 50));

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [fromAi, fromAssessments] = await Promise.all([
      db.aIInteraction.findMany({
        where: {
          createdAt: { gte: since },
          crisisFlag: true,
        },
        select: {
          clientId: true,
          crisisLevel: true,
          createdAt: true,
          responseText: true,
          client: {
            select: {
              id: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.assessment.findMany({
        where: {
          createdAt: { gte: since },
          severity: { in: ["HIGH", "CRITICAL"] },
        },
        select: {
          clientId: true,
          severity: true,
          score: true,
          createdAt: true,
          client: {
            select: {
              id: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const byClient = new Map<
      string,
      {
        clientId: string;
        name: string;
        email: string;
        highestRisk: CrisisLevel;
        latestSignalAt: Date;
        sources: string[];
        summary: string;
      }
    >();

    const severityToRisk = (severity: string): CrisisLevel => {
      if (severity === "CRITICAL") return CrisisLevel.CRITICAL;
      if (severity === "HIGH") return CrisisLevel.HIGH;
      return CrisisLevel.MEDIUM;
    };

    const rank = (level: CrisisLevel): number => {
      switch (level) {
        case CrisisLevel.CRITICAL:
          return 4;
        case CrisisLevel.HIGH:
          return 3;
        case CrisisLevel.MEDIUM:
          return 2;
        default:
          return 1;
      }
    };

    for (const signal of fromAi) {
      const existing = byClient.get(signal.clientId);
      const risk = signal.crisisLevel ?? CrisisLevel.HIGH;
      const next = {
        clientId: signal.clientId,
        name: signal.client.user.name,
        email: signal.client.user.email,
        highestRisk: existing
          ? rank(existing.highestRisk) > rank(risk)
            ? existing.highestRisk
            : risk
          : risk,
        latestSignalAt:
          existing && existing.latestSignalAt > signal.createdAt
            ? existing.latestSignalAt
            : signal.createdAt,
        sources: existing ? [...new Set([...existing.sources, "AI_INTERACTION"])] : ["AI_INTERACTION"],
        summary: existing?.summary ?? signal.responseText,
      };
      byClient.set(signal.clientId, next);
    }

    for (const assessment of fromAssessments) {
      const risk = severityToRisk(assessment.severity);
      const existing = byClient.get(assessment.clientId);
      const next = {
        clientId: assessment.clientId,
        name: assessment.client.user.name,
        email: assessment.client.user.email,
        highestRisk: existing
          ? rank(existing.highestRisk) > rank(risk)
            ? existing.highestRisk
            : risk
          : risk,
        latestSignalAt:
          existing && existing.latestSignalAt > assessment.createdAt
            ? existing.latestSignalAt
            : assessment.createdAt,
        sources: existing
          ? [...new Set([...existing.sources, "ASSESSMENT"])]
          : ["ASSESSMENT"],
        summary: existing?.summary ?? `Assessment severity ${assessment.severity} with score ${assessment.score}`,
      };
      byClient.set(assessment.clientId, next);
    }

    const users = [...byClient.values()]
      .sort((a, b) => {
        const riskDiff = rank(b.highestRisk) - rank(a.highestRisk);
        if (riskDiff !== 0) return riskDiff;
        return b.latestSignalAt.getTime() - a.latestSignalAt.getTime();
      })
      .slice(0, limit);

    return {
      days,
      total: users.length,
      users,
    };
  }

  private flattenValues(input: Prisma.InputJsonValue) {
    const numbers: number[] = [];
    const strings: string[] = [];
    const booleans: Array<{ key: string; value: boolean }> = [];

    const walk = (value: unknown, parentKey = "") => {
      if (typeof value === "number" && Number.isFinite(value)) {
        numbers.push(value);
        return;
      }

      if (typeof value === "string") {
        strings.push(value.toLowerCase());
        return;
      }

      if (typeof value === "boolean") {
        booleans.push({ key: parentKey, value });
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry, index) => walk(entry, `${parentKey}[${index}]`));
        return;
      }

      if (value && typeof value === "object") {
        Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
          walk(entry, parentKey ? `${parentKey}.${key}` : key);
        });
      }
    };

    walk(input);

    return { numbers, strings, booleans };
  }
}

export const crisisMonitoringService = new CrisisMonitoringService();
