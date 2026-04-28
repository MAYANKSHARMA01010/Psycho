import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError";

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  notes?: string;
}

export interface PrescriptionProps {
  id: string;
  therapistId: string;
  clientId: string;
  sessionId: string | null;
  medications: Medication[];
  instructions: string;
  diagnosis: string | null;
  pdfUrl: string | null;
  pdfPublicId: string | null;
  issuedAt: Date;
  createdAt: Date;
}

export interface CreatePrescriptionInput {
  therapistId: string;
  clientId: string;
  sessionId?: string;
  medications: Medication[];
  instructions: string;
  diagnosis?: string;
}

export class Prescription {
  public readonly id: string;
  public readonly therapistId: string;
  public readonly clientId: string;
  public readonly sessionId: string | null;
  public medications: Medication[];
  public instructions: string;
  public diagnosis: string | null;
  public pdfUrl: string | null;
  public pdfPublicId: string | null;
  public readonly issuedAt: Date;
  public readonly createdAt: Date;

  constructor(props: PrescriptionProps) {
    this.id = props.id;
    this.therapistId = props.therapistId;
    this.clientId = props.clientId;
    this.sessionId = props.sessionId;
    this.medications = props.medications;
    this.instructions = props.instructions;
    this.diagnosis = props.diagnosis;
    this.pdfUrl = props.pdfUrl;
    this.pdfPublicId = props.pdfPublicId;
    this.issuedAt = props.issuedAt;
    this.createdAt = props.createdAt;
  }

  public static create(input: CreatePrescriptionInput): Prescription {
    if (!input.medications.length) {
      throw ApiError.badRequest("At least one medication is required");
    }
    if (!input.instructions.trim()) {
      throw ApiError.badRequest("Instructions are required");
    }
    const now = new Date();
    return new Prescription({
      id: randomUUID(),
      therapistId: input.therapistId,
      clientId: input.clientId,
      sessionId: input.sessionId ?? null,
      medications: input.medications.map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration?.trim(),
        notes: m.notes?.trim(),
      })),
      instructions: input.instructions.trim(),
      diagnosis: input.diagnosis?.trim() ?? null,
      pdfUrl: null,
      pdfPublicId: null,
      issuedAt: now,
      createdAt: now,
    });
  }

  public static fromPersistence(record: any): Prescription {
    return new Prescription({
      id: record.id,
      therapistId: record.therapistId,
      clientId: record.clientId,
      sessionId: record.sessionId,
      medications: (record.medications as Medication[]) ?? [],
      instructions: record.instructions,
      diagnosis: record.diagnosis ?? null,
      pdfUrl: record.pdfUrl,
      pdfPublicId: record.pdfPublicId,
      issuedAt: record.issuedAt,
      createdAt: record.createdAt,
    });
  }

  public attachPdf(url: string, publicId: string): void {
    this.pdfUrl = url;
    this.pdfPublicId = publicId;
  }

  public toResponse() {
    return {
      id: this.id,
      therapistId: this.therapistId,
      clientId: this.clientId,
      sessionId: this.sessionId,
      medications: this.medications,
      instructions: this.instructions,
      diagnosis: this.diagnosis,
      pdfUrl: this.pdfUrl,
      issuedAt: this.issuedAt,
    };
  }

  public toPersistence() {
    return {
      id: this.id,
      therapistId: this.therapistId,
      clientId: this.clientId,
      sessionId: this.sessionId,
      medications: this.medications,
      instructions: this.instructions,
      diagnosis: this.diagnosis,
      pdfUrl: this.pdfUrl,
      pdfPublicId: this.pdfPublicId,
      issuedAt: this.issuedAt,
    };
  }
}
