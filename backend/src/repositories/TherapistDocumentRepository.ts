import { randomUUID } from "node:crypto";
import { DatabaseService } from "../config/database";
import { DocumentType } from "../entities/Therapist";

export interface TherapistDocumentRecord {
  id: string;
  therapistId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface CreateDocumentInput {
  therapistId: string;
  type: DocumentType;
  fileUrl: string;
  fileName?: string | null;
  notes?: string | null;
}

export class TherapistDocumentRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async listForTherapist(therapistId: string): Promise<TherapistDocumentRecord[]> {
    const db = await this.db();
    return (await db.therapistDocument.findMany({
      where: { therapistId },
      orderBy: { createdAt: "desc" },
    })) as unknown as TherapistDocumentRecord[];
  }

  public async findById(id: string): Promise<TherapistDocumentRecord | null> {
    const db = await this.db();
    const record = await db.therapistDocument.findUnique({ where: { id } });
    return (record as unknown as TherapistDocumentRecord | null) ?? null;
  }

  public async insert(input: CreateDocumentInput): Promise<TherapistDocumentRecord> {
    const db = await this.db();
    const record = await db.therapistDocument.create({
      data: {
        id: randomUUID(),
        therapistId: input.therapistId,
        type: input.type,
        fileUrl: input.fileUrl,
        fileName: input.fileName ?? null,
        notes: input.notes ?? null,
      },
    });
    return record as unknown as TherapistDocumentRecord;
  }

  public async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.therapistDocument.delete({ where: { id } });
  }
}

export const therapistDocumentRepository = new TherapistDocumentRepository();
