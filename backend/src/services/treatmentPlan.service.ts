import { Role } from "../constants/roles";
import { TreatmentPlan } from "../entities/TreatmentPlan";
import {
  TreatmentPlanRepository,
  treatmentPlanRepository,
} from "../repositories/TreatmentPlanRepository";
import {
  AssessmentRepository,
  assessmentRepository,
} from "../repositories/AssessmentRepository";
import { ApiError } from "../utils/ApiError";

export interface CreatePlanInput {
  clientId: string;
  assessmentId: string;
  goals: string;
  milestones: Array<{ title: string; description?: string }>;
  startDate?: Date;
  endDate?: Date | null;
}

export class TreatmentPlanService {
  constructor(
    private readonly plans: TreatmentPlanRepository = treatmentPlanRepository,
    private readonly assessments: AssessmentRepository = assessmentRepository,
  ) {}

  public async create(userId: string, userRole: string, input: CreatePlanInput) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can create treatment plans");
    }

    const assessment = await this.assessments.findById(input.assessmentId);
    if (!assessment) throw ApiError.notFound("Assessment");
    if (assessment.clientId !== input.clientId) {
      throw ApiError.badRequest("Assessment does not belong to the specified client");
    }

    const existing = await this.plans.findByAssessment(input.assessmentId);
    if (existing) {
      throw ApiError.conflict("A treatment plan already exists for this assessment");
    }

    const plan = TreatmentPlan.create({
      clientId: input.clientId,
      therapistId: userId,
      assessmentId: input.assessmentId,
      goals: input.goals,
      milestones: input.milestones,
      startDate: input.startDate,
      endDate: input.endDate,
    });
    const saved = await this.plans.insert(plan);
    return { plan: saved.toResponse() };
  }

  public async getById(userId: string, userRole: string, planId: string) {
    const plan = await this.plans.findById(planId);
    if (!plan) throw ApiError.notFound("Treatment plan");
    this.assertCanView(plan, userId, userRole);
    return { plan: plan.toResponse() };
  }

  public async listForClient(userId: string, userRole: string, clientId: string) {
    if (userRole === Role.CLIENT && clientId !== userId) {
      throw ApiError.forbidden("You cannot view another client's plans");
    }
    const plans = await this.plans.listForClient(clientId);
    if (userRole === Role.THERAPIST) {
      // Therapists only see plans they own
      return { plans: plans.filter((p) => p.therapistId === userId).map((p) => p.toResponse()) };
    }
    return { plans: plans.map((p) => p.toResponse()) };
  }

  public async listOwnAsTherapist(userId: string, userRole: string) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can use this endpoint");
    }
    const plans = await this.plans.listForTherapist(userId);
    return { plans: plans.map((p) => p.toResponse()) };
  }

  public async completeMilestone(
    userId: string,
    userRole: string,
    planId: string,
    milestoneId: string,
  ) {
    const plan = await this.plans.findById(planId);
    if (!plan) throw ApiError.notFound("Treatment plan");
    this.assertCanEdit(plan, userId, userRole);
    plan.completeMilestone(milestoneId);
    const saved = await this.plans.update(plan);
    return { plan: saved.toResponse() };
  }

  public async uncompleteMilestone(
    userId: string,
    userRole: string,
    planId: string,
    milestoneId: string,
  ) {
    const plan = await this.plans.findById(planId);
    if (!plan) throw ApiError.notFound("Treatment plan");
    this.assertCanEdit(plan, userId, userRole);
    plan.uncompleteMilestone(milestoneId);
    const saved = await this.plans.update(plan);
    return { plan: saved.toResponse() };
  }

  public async cancel(userId: string, userRole: string, planId: string) {
    const plan = await this.plans.findById(planId);
    if (!plan) throw ApiError.notFound("Treatment plan");
    if (userRole !== Role.THERAPIST || plan.therapistId !== userId) {
      throw ApiError.forbidden("Only the owning therapist can cancel a plan");
    }
    plan.cancel();
    const saved = await this.plans.update(plan);
    return { plan: saved.toResponse() };
  }

  private assertCanView(plan: TreatmentPlan, userId: string, userRole: string): void {
    if (userRole === Role.ADMIN) return;
    if (userRole === Role.CLIENT && plan.clientId === userId) return;
    if (userRole === Role.THERAPIST && plan.therapistId === userId) return;
    throw ApiError.forbidden("You cannot access this plan");
  }

  private assertCanEdit(plan: TreatmentPlan, userId: string, userRole: string): void {
    // Both client (mark milestones done) and owning therapist can edit;
    // admin cannot edit.
    if (userRole === Role.CLIENT && plan.clientId === userId) return;
    if (userRole === Role.THERAPIST && plan.therapistId === userId) return;
    throw ApiError.forbidden("You cannot edit this plan");
  }
}

export const treatmentPlanService = new TreatmentPlanService();
