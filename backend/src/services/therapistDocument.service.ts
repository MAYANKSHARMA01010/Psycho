import { Role } from "../constants/roles";
import { DocumentType } from "../entities/Therapist";
import {
  TherapistDocumentRepository,
  therapistDocumentRepository,
} from "../repositories/TherapistDocumentRepository";
import {
  TherapistRepository,
  therapistRepository,
} from "../repositories/TherapistRepository";
import { ApiError } from "../utils/ApiError";
import { UploadCategory, UploadService, uploadService } from "./upload.service";

export interface UploadDocumentPayload {
  type: DocumentType;
  fileUrl: string;
  fileName?: string;
  notes?: string;
}

export interface UploadDocumentMultipartPayload {
  type: DocumentType;
  file: Express.Multer.File;
  notes?: string;
}

export class TherapistDocumentService {
  constructor(
    private readonly documents: TherapistDocumentRepository = therapistDocumentRepository,
    private readonly therapists: TherapistRepository = therapistRepository,
    private readonly uploads: UploadService = uploadService,
  ) {}

  public async upload(userId: string, userRole: string, payload: UploadDocumentPayload) {
    this.ensureTherapist(userRole);

    const therapist = await this.therapists.findById(userId);
    if (!therapist) {
      throw ApiError.notFound("Therapist profile");
    }

    const document = await this.documents.insert({
      therapistId: userId,
      type: payload.type,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName ?? null,
      notes: payload.notes ?? null,
    });

    return { document };
  }

  public async uploadMultipart(
    userId: string,
    userRole: string,
    payload: UploadDocumentMultipartPayload,
  ) {
    this.ensureTherapist(userRole);

    const therapist = await this.therapists.findById(userId);
    if (!therapist) {
      throw ApiError.notFound("Therapist profile");
    }

    const category: UploadCategory =
      payload.type === "ID_PROOF" ? "id_proof" : "certificate";

    const result = await this.uploads.uploadBuffer(payload.file.buffer, {
      category,
      ownerId: userId,
      filename: payload.file.originalname,
      contentType: payload.file.mimetype,
    });

    const document = await this.documents.insert({
      therapistId: userId,
      type: payload.type,
      fileUrl: result.url,
      fileName: payload.file.originalname,
      notes: payload.notes ?? null,
    });

    return { document };
  }

  public async listOwn(userId: string, userRole: string) {
    this.ensureTherapist(userRole);
    const documents = await this.documents.listForTherapist(userId);
    return { documents };
  }

  public async listForTherapist(therapistId: string, userRole: string) {
    if (userRole !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can view another therapist's documents");
    }
    const documents = await this.documents.listForTherapist(therapistId);
    return { documents };
  }

  public async delete(userId: string, userRole: string, documentId: string) {
    const document = await this.documents.findById(documentId);
    if (!document) {
      throw ApiError.notFound("Document");
    }

    const isOwner = userRole === Role.THERAPIST && document.therapistId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden("You cannot delete this document");
    }

    await this.documents.delete(documentId);
  }

  private ensureTherapist(role: string): void {
    if (role !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can perform this action");
    }
  }
}

export const therapistDocumentService = new TherapistDocumentService();
