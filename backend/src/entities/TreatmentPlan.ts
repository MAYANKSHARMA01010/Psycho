import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError";

export type TreatmentPlanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  completedAt: Date | null;
}

export interface TreatmentPlanProps {
  id: string;
  clientId: string;
  therapistId: string;
  assessmentId: string;
  goals: string;
  milestones: Milestone[];
  status: TreatmentPlanStatus;
  progress: number;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTreatmentPlanInput {
  clientId: string;
  therapistId: string;
  assessmentId: string;
  goals: string;
  milestones: Array<{ title: string; description?: string }>;
  startDate?: Date;
  endDate?: Date | null;
}

export class TreatmentPlan {
  public readonly id: string;
  public readonly clientId: string;
  public readonly therapistId: string;
  public readonly assessmentId: string;
  public goals: string;
  public milestones: Milestone[];
  public status: TreatmentPlanStatus;
  public progress: number;
  public startDate: Date;
  public endDate: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: TreatmentPlanProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.therapistId = props.therapistId;
    this.assessmentId = props.assessmentId;
    this.goals = props.goals;
    this.milestones = props.milestones;
    this.status = props.status;
    this.progress = props.progress;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(input: CreateTreatmentPlanInput): TreatmentPlan {
    if (!input.milestones.length) {
      throw ApiError.badRequest("At least one milestone is required");
    }
    const milestones: Milestone[] = input.milestones.map((m) => ({
      id: randomUUID(),
      title: m.title.trim(),
      description: m.description?.trim(),
      done: false,
      completedAt: null,
    }));
    const now = new Date();
    return new TreatmentPlan({
      id: randomUUID(),
      clientId: input.clientId,
      therapistId: input.therapistId,
      assessmentId: input.assessmentId,
      goals: input.goals.trim(),
      milestones,
      status: "ACTIVE",
      progress: 0,
      startDate: input.startDate ?? now,
      endDate: input.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(record: any): TreatmentPlan {
    return new TreatmentPlan({
      id: record.id,
      clientId: record.clientId,
      therapistId: record.therapistId,
      assessmentId: record.assessmentId,
      goals: record.goals,
      milestones: (record.milestones as Milestone[]) ?? [],
      status: record.status,
      progress: record.progress ?? 0,
      startDate: record.startDate,
      endDate: record.endDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public completeMilestone(milestoneId: string): void {
    if (this.status !== "ACTIVE") {
      throw ApiError.conflict(`Cannot edit milestones on a ${this.status} plan`);
    }
    const milestone = this.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw ApiError.notFound("Milestone");
    if (milestone.done) return;
    milestone.done = true;
    milestone.completedAt = new Date();
    this.recomputeProgress();
    if (this.progress >= 100) this.status = "COMPLETED";
    this.updatedAt = new Date();
  }

  public uncompleteMilestone(milestoneId: string): void {
    const milestone = this.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw ApiError.notFound("Milestone");
    if (!milestone.done) return;
    milestone.done = false;
    milestone.completedAt = null;
    if (this.status === "COMPLETED") this.status = "ACTIVE";
    this.recomputeProgress();
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.status === "CANCELLED") return;
    this.status = "CANCELLED";
    this.updatedAt = new Date();
  }

  public toResponse() {
    return {
      id: this.id,
      clientId: this.clientId,
      therapistId: this.therapistId,
      assessmentId: this.assessmentId,
      goals: this.goals,
      milestones: this.milestones,
      status: this.status,
      progress: this.progress,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  public toPersistence() {
    return {
      id: this.id,
      clientId: this.clientId,
      therapistId: this.therapistId,
      assessmentId: this.assessmentId,
      goals: this.goals,
      milestones: this.milestones,
      status: this.status,
      progress: this.progress,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  private recomputeProgress(): void {
    if (!this.milestones.length) {
      this.progress = 0;
      return;
    }
    const done = this.milestones.filter((m) => m.done).length;
    this.progress = +((done / this.milestones.length) * 100).toFixed(2);
  }
}
