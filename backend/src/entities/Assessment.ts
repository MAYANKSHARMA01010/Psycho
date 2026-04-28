import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError";

export type AssessmentSeverity =
  | "MINIMAL"
  | "MILD"
  | "MODERATE"
  | "MODERATELY_SEVERE"
  | "SEVERE";

export type AssessmentType = "PHQ9" | "GAD7" | "CUSTOM";

export interface AssessmentResponse {
  id: string;
  clientId: string;
  type: AssessmentType;
  responses: number[];
  score: number;
  severity: AssessmentSeverity;
  crisisFlag: boolean;
  completedAt: Date;
  createdAt: Date;
}

const PHQ9_QUESTION_COUNT = 9;
const GAD7_QUESTION_COUNT = 7;
const PHQ9_SUICIDE_QUESTION_INDEX = 8; // 0-indexed Q9
const RESPONSE_RANGE = [0, 1, 2, 3];

export class Assessment {
  public readonly id: string;
  public readonly clientId: string;
  public readonly type: AssessmentType;
  public readonly responses: number[];
  public readonly score: number;
  public readonly severity: AssessmentSeverity;
  public readonly crisisFlag: boolean;
  public readonly completedAt: Date;
  public readonly createdAt: Date;

  private constructor(params: AssessmentResponse) {
    this.id = params.id;
    this.clientId = params.clientId;
    this.type = params.type;
    this.responses = params.responses;
    this.score = params.score;
    this.severity = params.severity;
    this.crisisFlag = params.crisisFlag;
    this.completedAt = params.completedAt;
    this.createdAt = params.createdAt;
  }

  public static create(input: {
    clientId: string;
    type: AssessmentType;
    responses: number[];
  }): Assessment {
    Assessment.validateResponses(input.type, input.responses);
    const score = input.responses.reduce((sum, v) => sum + v, 0);
    const severity = Assessment.scoreToSeverity(input.type, score);
    const crisisFlag = Assessment.detectCrisis(input.type, input.responses, score);
    const now = new Date();
    return new Assessment({
      id: randomUUID(),
      clientId: input.clientId,
      type: input.type,
      responses: input.responses,
      score,
      severity,
      crisisFlag,
      completedAt: now,
      createdAt: now,
    });
  }

  public static fromPersistence(record: any): Assessment {
    return new Assessment({
      id: record.id,
      clientId: record.clientId,
      type: record.type,
      responses: record.responses as number[],
      score: record.score,
      severity: record.severity,
      crisisFlag: record.crisisFlag,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
    });
  }

  public toResponse(): AssessmentResponse {
    return {
      id: this.id,
      clientId: this.clientId,
      type: this.type,
      responses: this.responses,
      score: this.score,
      severity: this.severity,
      crisisFlag: this.crisisFlag,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
    };
  }

  // ---- pure scoring helpers (also exported for tests) ----

  public static validateResponses(type: AssessmentType, responses: number[]): void {
    const expected =
      type === "PHQ9"
        ? PHQ9_QUESTION_COUNT
        : type === "GAD7"
          ? GAD7_QUESTION_COUNT
          : null;
    if (expected !== null && responses.length !== expected) {
      throw ApiError.badRequest(
        `${type} requires exactly ${expected} responses, got ${responses.length}`,
      );
    }
    if (responses.length < 1 || responses.length > 50) {
      throw ApiError.badRequest("Invalid number of responses");
    }
    if (responses.some((v) => !Number.isInteger(v) || !RESPONSE_RANGE.includes(v))) {
      throw ApiError.badRequest("Each response must be 0, 1, 2, or 3");
    }
  }

  public static scoreToSeverity(type: AssessmentType, score: number): AssessmentSeverity {
    if (type === "GAD7") {
      if (score <= 4) return "MINIMAL";
      if (score <= 9) return "MILD";
      if (score <= 14) return "MODERATE";
      return "SEVERE";
    }
    // PHQ9 / CUSTOM (using PHQ9 cutoffs as sensible default)
    if (score <= 4) return "MINIMAL";
    if (score <= 9) return "MILD";
    if (score <= 14) return "MODERATE";
    if (score <= 19) return "MODERATELY_SEVERE";
    return "SEVERE";
  }

  public static detectCrisis(
    type: AssessmentType,
    responses: number[],
    score: number,
  ): boolean {
    if (type === "PHQ9" && responses[PHQ9_SUICIDE_QUESTION_INDEX] >= 1) {
      return true;
    }
    return score >= 20;
  }
}
