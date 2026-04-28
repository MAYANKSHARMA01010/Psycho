import { DatabaseService } from "../config/database";
import { TreatmentPlan } from "../entities/TreatmentPlan";

export class TreatmentPlanRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findById(id: string): Promise<TreatmentPlan | null> {
    const db = await this.db();
    const record = await db.treatmentPlan.findUnique({ where: { id } });
    return record ? TreatmentPlan.fromPersistence(record) : null;
  }

  public async findByAssessment(assessmentId: string): Promise<TreatmentPlan | null> {
    const db = await this.db();
    const record = await db.treatmentPlan.findUnique({ where: { assessmentId } });
    return record ? TreatmentPlan.fromPersistence(record) : null;
  }

  public async insert(plan: TreatmentPlan): Promise<TreatmentPlan> {
    const db = await this.db();
    const data = plan.toPersistence();
    const record = await db.treatmentPlan.create({
      data: {
        id: data.id,
        clientId: data.clientId,
        therapistId: data.therapistId,
        assessmentId: data.assessmentId,
        goals: data.goals,
        milestones: data.milestones as any,
        status: data.status,
        progress: data.progress,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
    return TreatmentPlan.fromPersistence(record);
  }

  public async update(plan: TreatmentPlan): Promise<TreatmentPlan> {
    const db = await this.db();
    const data = plan.toPersistence();
    const record = await db.treatmentPlan.update({
      where: { id: data.id },
      data: {
        goals: data.goals,
        milestones: data.milestones as any,
        status: data.status,
        progress: data.progress,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
    return TreatmentPlan.fromPersistence(record);
  }

  public async listForClient(clientId: string) {
    const db = await this.db();
    const records = await db.treatmentPlan.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
    return records.map(TreatmentPlan.fromPersistence);
  }

  public async listForTherapist(therapistId: string) {
    const db = await this.db();
    const records = await db.treatmentPlan.findMany({
      where: { therapistId },
      orderBy: { createdAt: "desc" },
    });
    return records.map(TreatmentPlan.fromPersistence);
  }
}

export const treatmentPlanRepository = new TreatmentPlanRepository();
