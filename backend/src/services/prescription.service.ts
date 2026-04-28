import { NotificationChannel, NotificationType, Role, type Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export interface CreatePrescriptionPayload {
  clientId: string;
  medications: Prisma.InputJsonValue;
  instructions: string;
}

export class PrescriptionService {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async create(userId: string, userRole: string, payload: CreatePrescriptionPayload) {
    this.ensureRole(userRole, Role.THERAPIST);

    const db = await this.db();

    const client = await db.client.findUnique({ where: { id: payload.clientId }, select: { id: true } });
    if (client === null) {
      throw ApiError.notFound("Client profile");
    }

    const prescription = await db.prescription.create({
      data: {
        therapistId: userId,
        clientId: payload.clientId,
        medications: payload.medications,
        instructions: payload.instructions.trim(),
      },
      include: {
        client: { select: { id: true, user: { select: { name: true, email: true } } } },
        therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    await notificationService.sendToUsers({
      userIds: [payload.clientId],
      type: NotificationType.MEDICATION_REMINDER,
      channels: [NotificationChannel.PUSH],
      title: "New Prescription Added",
      message: "A therapist has added a new prescription for your treatment plan.",
      metadata: {
        prescriptionId: prescription.id,
      },
      clientId: payload.clientId,
    });

    return { prescription };
  }

  public async listMine(userId: string, userRole: string, options: { page?: number; limit?: number }) {
    const db = await this.db();
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    if (userRole !== Role.CLIENT && userRole !== Role.THERAPIST && userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Unsupported role for this endpoint");
    }

    const where: Prisma.PrescriptionWhereInput =
      userRole === Role.CLIENT
        ? { clientId: userId }
        : userRole === Role.THERAPIST
          ? { therapistId: userId }
          : {};

    const [prescriptions, total] = await Promise.all([
      db.prescription.findMany({
        where,
        include: {
          client: { select: { id: true, user: { select: { name: true, email: true } } } },
          therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
        },
        orderBy: { issuedAt: "desc" },
        skip,
        take: limit,
      }),
      db.prescription.count({ where }),
    ]);

    return {
      prescriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  public async getById(userId: string, userRole: string, prescriptionId: string) {
    const prescription = await this.getPrescriptionWithUsers(prescriptionId);

    const canAccess =
      userRole === Role.ADMIN ||
      (userRole === Role.CLIENT && prescription.clientId === userId) ||
      (userRole === Role.THERAPIST && prescription.therapistId === userId);

    if (canAccess === false) {
      throw ApiError.forbidden("You cannot access this prescription");
    }

    return { prescription };
  }

  public async generatePdf(userId: string, userRole: string, prescriptionId: string) {
    const db = await this.db();
    const prescription = await this.getPrescriptionWithUsers(prescriptionId);

    const canGenerate =
      userRole === Role.ADMIN ||
      (userRole === Role.THERAPIST && prescription.therapistId === userId);

    if (canGenerate === false) {
      throw ApiError.forbidden("Only the prescribing therapist or admin can generate PDF");
    }

    const lines = [
      "Zenora Prescription",
      `Prescription ID: ${prescription.id}`,
      `Issued At: ${prescription.issuedAt.toISOString()}`,
      `Client: ${prescription.client.user.name} (${prescription.client.user.email})`,
      `Therapist: ${prescription.therapist.user.name} (${prescription.therapist.user.email})`,
      "",
      `Instructions: ${prescription.instructions}`,
      "",
      `Medications: ${JSON.stringify(prescription.medications)}`,
    ];

    const pdfBuffer = this.buildSimplePdf(lines);
    const pdfDataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    const updated = await db.prescription.update({
      where: { id: prescriptionId },
      data: { pdfUrl: pdfDataUrl },
    });

    return {
      prescription: updated,
      pdf: {
        byteLength: pdfBuffer.byteLength,
        dataUrl: pdfDataUrl,
      },
    };
  }

  public async sharePrescription(
    userId: string,
    userRole: string,
    prescriptionId: string,
    payload: { channels: NotificationChannel[]; message?: string },
  ) {
    const prescription = await this.getPrescriptionWithUsers(prescriptionId);

    const canShare =
      userRole === Role.ADMIN ||
      (userRole === Role.THERAPIST && prescription.therapistId === userId);

    if (canShare === false) {
      throw ApiError.forbidden("Only the prescribing therapist or admin can share prescription");
    }

    const channels = payload.channels.length
      ? payload.channels
      : [NotificationChannel.PUSH, NotificationChannel.EMAIL];

    const message =
      payload.message?.trim() ||
      `Your prescription is ready. ${prescription.pdfUrl ? "PDF has been generated." : "PDF generation pending."}`;

    const result = await notificationService.sendToUsers({
      userIds: [prescription.clientId],
      type: NotificationType.MEDICATION_REMINDER,
      channels,
      title: "Prescription Shared",
      message,
      metadata: {
        prescriptionId: prescription.id,
        pdfAvailable: Boolean(prescription.pdfUrl),
        pdfUrl: prescription.pdfUrl,
      },
      clientId: prescription.clientId,
    });

    return {
      shared: result,
      prescriptionId: prescription.id,
    };
  }

  private async getPrescriptionWithUsers(prescriptionId: string) {
    const db = await this.db();

    const prescription = await db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        client: { select: { id: true, user: { select: { name: true, email: true } } } },
        therapist: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    if (prescription === null) {
      throw ApiError.notFound("Prescription");
    }

    return prescription;
  }

  private buildSimplePdf(lines: string[]): Buffer {
    const escaped = lines.map((line) =>
      line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"),
    );

    const textOps: string[] = ["BT", "/F1 12 Tf", "50 780 Td"];

    escaped.forEach((line, index) => {
      if (index === 0) {
        textOps.push(`(${line}) Tj`);
      } else {
        textOps.push(`0 -16 Td (${line}) Tj`);
      }
    });

    textOps.push("ET");

    const stream = textOps.join("\n");

    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
      `5 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream\nendobj\n`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];

    objects.forEach((obj) => {
      offsets.push(Buffer.byteLength(pdf, "utf8"));
      pdf += obj;
    });

    const xrefStart = Buffer.byteLength(pdf, "utf8");

    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let i = 1; i <= objects.length; i++) {
      const offset = String(offsets[i]).padStart(10, "0");
      pdf += `${offset} 00000 n \n`;
    }

    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(pdf, "utf8");
  }

  private ensureRole(actualRole: string, expectedRole: Role) {
    if (actualRole !== expectedRole) {
      throw ApiError.forbidden(`Only ${expectedRole.toLowerCase()}s can perform this action`);
    }
  }
}

export const prescriptionService = new PrescriptionService();
