import { DatabaseService } from "../config/database";
import { Prescription } from "../entities/Prescription";

export class PrescriptionRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findById(id: string): Promise<Prescription | null> {
    const db = await this.db();
    const record = await db.prescription.findUnique({ where: { id } });
    return record ? Prescription.fromPersistence(record) : null;
  }

  public async insert(p: Prescription): Promise<Prescription> {
    const db = await this.db();
    const data = p.toPersistence();
    const record = await db.prescription.create({
      data: {
        id: data.id,
        therapistId: data.therapistId,
        clientId: data.clientId,
        sessionId: data.sessionId ?? undefined,
        medications: data.medications as any,
        instructions: data.instructions,
        diagnosis: data.diagnosis,
        pdfUrl: data.pdfUrl,
        pdfPublicId: data.pdfPublicId,
        issuedAt: data.issuedAt,
      },
    });
    return Prescription.fromPersistence(record);
  }

  public async update(p: Prescription): Promise<Prescription> {
    const db = await this.db();
    const data = p.toPersistence();
    const record = await db.prescription.update({
      where: { id: data.id },
      data: {
        pdfUrl: data.pdfUrl,
        pdfPublicId: data.pdfPublicId,
      },
    });
    return Prescription.fromPersistence(record);
  }

  public async listForClient(clientId: string) {
    const db = await this.db();
    const records = await db.prescription.findMany({
      where: { clientId },
      orderBy: { issuedAt: "desc" },
    });
    return records.map(Prescription.fromPersistence);
  }

  public async listForTherapist(therapistId: string) {
    const db = await this.db();
    const records = await db.prescription.findMany({
      where: { therapistId },
      orderBy: { issuedAt: "desc" },
    });
    return records.map(Prescription.fromPersistence);
  }
}

export const prescriptionRepository = new PrescriptionRepository();
