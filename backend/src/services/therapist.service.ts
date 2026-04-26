import { Role } from "../constants/roles";
import { Therapist } from "../entities/Therapist";
import {
  TherapistRepository,
  therapistRepository,
  TherapistSearchFilters,
  PaginationOptions,
} from "../repositories/TherapistRepository";
import { UserRepository, userRepository } from "../repositories/UserRepository";
import { ApiError } from "../utils/ApiError";

export interface CreateTherapistProfilePayload {
  licenseNumber: string;
  specialization: string;
  experience: number;
  workingHours: unknown;
  languages?: string[];
  bio?: string;
  hourlyRate?: number;
  bankAccountInfo?: unknown;
}

export interface UpdateTherapistProfilePayload {
  specialization?: string;
  experience?: number;
  workingHours?: unknown;
  languages?: string[];
  bio?: string | null;
  hourlyRate?: number | null;
  bankAccountInfo?: unknown;
}

export class TherapistService {
  constructor(
    private readonly therapists: TherapistRepository = therapistRepository,
    private readonly users: UserRepository = userRepository,
  ) {}

  public async createOwnProfile(
    userId: string,
    userRole: string,
    payload: CreateTherapistProfilePayload,
  ) {
    this.ensureTherapist(userRole);

    const existing = await this.therapists.findById(userId);
    if (existing) {
      throw ApiError.conflict("Therapist profile already exists");
    }

    const duplicateLicense = await this.therapists.findByLicense(payload.licenseNumber);
    if (duplicateLicense) {
      throw ApiError.conflict("This license number is already registered");
    }

    const therapist = Therapist.create({
      userId,
      licenseNumber: payload.licenseNumber,
      specialization: payload.specialization,
      experience: payload.experience,
      workingHours: payload.workingHours,
      languages: payload.languages,
      bio: payload.bio,
      hourlyRate: payload.hourlyRate,
      bankAccountInfo: payload.bankAccountInfo,
    });

    const saved = await this.therapists.insert(therapist);
    return { profile: saved.toResponse() };
  }

  public async updateOwnProfile(
    userId: string,
    userRole: string,
    payload: UpdateTherapistProfilePayload,
  ) {
    this.ensureTherapist(userRole);
    const therapist = await this.therapists.findById(userId);
    if (!therapist) {
      throw ApiError.notFound("Therapist profile");
    }

    therapist.updateProfile(payload);
    const saved = await this.therapists.update(therapist);
    return { profile: saved.toResponse() };
  }

  public async getOwnProfile(userId: string, userRole: string) {
    this.ensureTherapist(userRole);
    const therapist = await this.therapists.findById(userId);
    if (!therapist) {
      throw ApiError.notFound("Therapist profile");
    }
    return { profile: therapist.toResponse() };
  }

  public async getPublicProfileById(therapistId: string) {
    const therapist = await this.therapists.findById(therapistId);
    if (!therapist) {
      throw ApiError.notFound("Therapist");
    }
    if (!therapist.canAcceptBookings()) {
      throw ApiError.notFound("Therapist");
    }

    const user = await this.users.findById(therapistId);
    if (!user || !user.isActive) {
      throw ApiError.notFound("Therapist");
    }

    return {
      therapist: therapist.toResponse(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  public async search(filters: TherapistSearchFilters, pagination: PaginationOptions) {
    const result = await this.therapists.search(filters, pagination);
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

  private ensureTherapist(role: string): void {
    if (role !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can perform this action");
    }
  }
}

export const therapistService = new TherapistService();
