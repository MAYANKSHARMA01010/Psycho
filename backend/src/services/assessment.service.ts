import { Role } from "../constants/roles";
import { Assessment, AssessmentType } from "../entities/Assessment";
import {
  AssessmentRepository,
  assessmentRepository,
} from "../repositories/AssessmentRepository";
import { ApiError } from "../utils/ApiError";

export interface SubmitAssessmentInput {
  type: AssessmentType;
  responses: number[];
}

export class AssessmentService {
  constructor(private readonly assessments: AssessmentRepository = assessmentRepository) {}

  public async submit(userId: string, userRole: string, input: SubmitAssessmentInput) {
    if (userRole !== Role.CLIENT) {
      throw ApiError.forbidden("Only clients can submit assessments");
    }
    const assessment = Assessment.create({
      clientId: userId,
      type: input.type,
      responses: input.responses,
    });
    const saved = await this.assessments.insert(assessment);
    return { assessment: saved.toResponse() };
  }

  public async listOwn(userId: string, userRole: string, page: number, limit: number) {
    if (userRole !== Role.CLIENT) {
      throw ApiError.forbidden("Only clients can list their assessments");
    }
    const result = await this.assessments.listForClient(userId, page, limit);
    return {
      items: result.items.map((a) => a.toResponse()),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getById(userId: string, userRole: string, assessmentId: string) {
    const assessment = await this.assessments.findById(assessmentId);
    if (!assessment) throw ApiError.notFound("Assessment");

    if (userRole === Role.CLIENT && assessment.clientId !== userId) {
      throw ApiError.forbidden("You cannot view this assessment");
    }
    // Therapists who treat the client and admins can view; broader
    // therapist access is gated at the route level for now.

    return { assessment: assessment.toResponse() };
  }

  public async latestForClient(userId: string, userRole: string, clientId: string) {
    if (userRole === Role.CLIENT && clientId !== userId) {
      throw ApiError.forbidden("You cannot view another client's assessment");
    }
    const assessment = await this.assessments.latestForClient(clientId);
    return { assessment: assessment ? assessment.toResponse() : null };
  }
}

export const assessmentService = new AssessmentService();
