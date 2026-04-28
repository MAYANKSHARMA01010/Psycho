import { DatabaseService } from "../config/database";
import { Assessment } from "../entities/Assessment";

export class AssessmentRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async insert(assessment: Assessment): Promise<Assessment> {
    const db = await this.db();
    const record = await db.assessment.create({
      data: {
        id: assessment.id,
        clientId: assessment.clientId,
        type: assessment.type,
        responses: assessment.responses as any,
        score: assessment.score,
        severity: assessment.severity,
        crisisFlag: assessment.crisisFlag,
        completedAt: assessment.completedAt,
      },
    });
    return Assessment.fromPersistence(record);
  }

  public async findById(id: string): Promise<Assessment | null> {
    const db = await this.db();
    const record = await db.assessment.findUnique({ where: { id } });
    return record ? Assessment.fromPersistence(record) : null;
  }

  public async listForClient(clientId: string, page: number, limit: number) {
    const db = await this.db();
    const [items, total] = await Promise.all([
      db.assessment.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.assessment.count({ where: { clientId } }),
    ]);
    return {
      items: items.map(Assessment.fromPersistence),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async latestForClient(clientId: string): Promise<Assessment | null> {
    const db = await this.db();
    const record = await db.assessment.findFirst({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
    return record ? Assessment.fromPersistence(record) : null;
  }
}

export const assessmentRepository = new AssessmentRepository();
