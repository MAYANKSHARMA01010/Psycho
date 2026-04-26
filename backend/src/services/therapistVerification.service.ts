import { Role } from "../constants/roles";
import { VerificationStatus } from "../entities/Therapist";
import {
  TherapistRepository,
  therapistRepository,
  PaginationOptions,
} from "../repositories/TherapistRepository";
import {
  TherapistDocumentRepository,
  therapistDocumentRepository,
} from "../repositories/TherapistDocumentRepository";
import { ApiError } from "../utils/ApiError";

export class TherapistVerificationService {
  constructor(
    private readonly therapists: TherapistRepository = therapistRepository,
    private readonly documents: TherapistDocumentRepository = therapistDocumentRepository,
  ) {}

  public async list(userRole: string, status: VerificationStatus, pagination: PaginationOptions) {
    this.ensureAdmin(userRole);
    const result = await this.therapists.listByVerificationStatus(status, pagination);
    return {
      items: result.items.map(({ therapist, user }) => ({
        ...therapist.toResponse(),
        user,
      })),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  public async getReviewBundle(userRole: string, therapistId: string) {
    this.ensureAdmin(userRole);
    const therapist = await this.therapists.findById(therapistId);
    if (!therapist) {
      throw ApiError.notFound("Therapist");
    }
    const documents = await this.documents.listForTherapist(therapistId);
    return {
      therapist: therapist.toResponse(),
      documents,
    };
  }

  public async approve(userRole: string, therapistId: string) {
    this.ensureAdmin(userRole);
    const therapist = await this.therapists.findById(therapistId);
    if (!therapist) {
      throw ApiError.notFound("Therapist");
    }
    therapist.approve();
    const saved = await this.therapists.update(therapist);
    return { therapist: saved.toResponse() };
  }

  public async reject(userRole: string, therapistId: string, reason: string) {
    this.ensureAdmin(userRole);
    const therapist = await this.therapists.findById(therapistId);
    if (!therapist) {
      throw ApiError.notFound("Therapist");
    }
    therapist.reject(reason);
    const saved = await this.therapists.update(therapist);
    return { therapist: saved.toResponse() };
  }

  private ensureAdmin(role: string): void {
    if (role !== Role.ADMIN) {
      throw ApiError.forbidden("Only admins can review therapist verification");
    }
  }
}

export const therapistVerificationService = new TherapistVerificationService();
