import PDFDocument from "pdfkit";
import { Role } from "../constants/roles";
import { Prescription } from "../entities/Prescription";
import {
  PrescriptionRepository,
  prescriptionRepository,
} from "../repositories/PrescriptionRepository";
import { UploadService, uploadService } from "./upload.service";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

export interface CreatePrescriptionPayload {
  clientId: string;
  sessionId?: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    notes?: string;
  }>;
  instructions: string;
  diagnosis?: string;
}

export class PrescriptionService {
  constructor(
    private readonly prescriptions: PrescriptionRepository = prescriptionRepository,
    private readonly uploads: UploadService = uploadService,
  ) {}

  public async create(userId: string, userRole: string, payload: CreatePrescriptionPayload) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can create prescriptions");
    }

    const prescription = Prescription.create({
      therapistId: userId,
      clientId: payload.clientId,
      sessionId: payload.sessionId,
      medications: payload.medications,
      instructions: payload.instructions,
      diagnosis: payload.diagnosis,
    });
    const saved = await this.prescriptions.insert(prescription);

    // Generate PDF in background-best-effort (don't fail the request).
    this.attachPdf(saved).catch((err) => logger.error("[prescription] pdf generation failed", err));

    return { prescription: saved.toResponse() };
  }

  public async getById(userId: string, userRole: string, id: string) {
    const p = await this.prescriptions.findById(id);
    if (!p) throw ApiError.notFound("Prescription");
    this.assertCanView(p, userId, userRole);
    return { prescription: p.toResponse() };
  }

  public async listForClient(userId: string, userRole: string, clientId: string) {
    if (userRole === Role.CLIENT && clientId !== userId) {
      throw ApiError.forbidden("You cannot view another client's prescriptions");
    }
    let items = await this.prescriptions.listForClient(clientId);
    if (userRole === Role.THERAPIST) {
      items = items.filter((p) => p.therapistId === userId);
    }
    return { items: items.map((p) => p.toResponse()) };
  }

  public async listOwnAsTherapist(userId: string, userRole: string) {
    if (userRole !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can use this endpoint");
    }
    const items = await this.prescriptions.listForTherapist(userId);
    return { items: items.map((p) => p.toResponse()) };
  }

  public async regeneratePdf(userId: string, userRole: string, id: string) {
    const p = await this.prescriptions.findById(id);
    if (!p) throw ApiError.notFound("Prescription");
    if (!(userRole === Role.ADMIN || (userRole === Role.THERAPIST && p.therapistId === userId))) {
      throw ApiError.forbidden("You cannot regenerate this prescription");
    }
    await this.attachPdf(p);
    const fresh = await this.prescriptions.findById(id);
    return { prescription: fresh!.toResponse() };
  }

  private assertCanView(p: Prescription, userId: string, userRole: string): void {
    if (userRole === Role.ADMIN) return;
    if (userRole === Role.CLIENT && p.clientId === userId) return;
    if (userRole === Role.THERAPIST && p.therapistId === userId) return;
    throw ApiError.forbidden("You cannot view this prescription");
  }

  private async attachPdf(p: Prescription): Promise<void> {
    try {
      const buffer = await this.renderPdf(p);
      const result = await this.uploads.uploadBuffer(buffer, {
        category: "prescription",
        ownerId: p.clientId,
        filename: `prescription-${p.id}.pdf`,
        contentType: "application/pdf",
        resourceType: "raw",
      });
      p.attachPdf(result.url, result.publicId);
      await this.prescriptions.update(p);
    } catch (err) {
      logger.error("[prescription] failed to upload pdf", err as any);
    }
  }

  private async renderPdf(p: Prescription): Promise<Buffer> {
    const db = await DatabaseService.getInstance();
    const [therapistUser, clientUser] = await Promise.all([
      db.user.findUnique({ where: { id: p.therapistId }, select: { name: true } }),
      db.user.findUnique({ where: { id: p.clientId }, select: { name: true, email: true } }),
    ]);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text("Zenora Mental Healthcare", { align: "center" });
      doc.fontSize(12).fillColor("#666").text("Prescription", { align: "center" });
      doc.moveDown();

      doc.fillColor("#000").fontSize(11);
      doc.text(`Date: ${p.issuedAt.toISOString().slice(0, 10)}`);
      doc.text(`Prescription ID: ${p.id.slice(0, 8).toUpperCase()}`);
      doc.moveDown();

      doc.fontSize(12).text(`Patient: ${clientUser?.name ?? "Unknown"}`);
      if (clientUser?.email) doc.fontSize(10).fillColor("#444").text(clientUser.email);
      doc.fillColor("#000").fontSize(12).text(`Therapist: ${therapistUser?.name ?? "Unknown"}`);
      doc.moveDown();

      if (p.diagnosis) {
        doc.fontSize(12).text("Diagnosis:", { underline: true });
        doc.fontSize(11).text(p.diagnosis);
        doc.moveDown();
      }

      doc.fontSize(12).text("Medications:", { underline: true });
      p.medications.forEach((m, i) => {
        doc.fontSize(11).fillColor("#000").text(`${i + 1}. ${m.name}`, { continued: true });
        doc.fontSize(10).fillColor("#555").text(`  —  ${m.dosage}, ${m.frequency}`);
        if (m.duration) doc.fontSize(10).fillColor("#555").text(`     Duration: ${m.duration}`);
        if (m.notes) doc.fontSize(10).fillColor("#555").text(`     Notes: ${m.notes}`);
      });
      doc.moveDown();

      doc.fontSize(12).fillColor("#000").text("Instructions:", { underline: true });
      doc.fontSize(11).text(p.instructions);
      doc.moveDown(2);

      doc.fontSize(10).fillColor("#999").text(
        "This prescription is digitally generated by Zenora and is valid only for the named patient.",
        { align: "center" },
      );
      doc.end();
    });
  }
}

export const prescriptionService = new PrescriptionService();
