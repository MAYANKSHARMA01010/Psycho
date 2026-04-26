import { Prisma } from "@prisma/client";
import { DatabaseService } from "../config/database";
import { Therapist, VerificationStatus } from "../entities/Therapist";

export interface TherapistSearchFilters {
  specialization?: string;
  language?: string;
  minRating?: number;
  hasAvailability?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: "rating" | "experience" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TherapistRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findById(id: string): Promise<Therapist | null> {
    const db = await this.db();
    const record = await db.therapist.findUnique({ where: { id } });
    return record ? Therapist.fromPersistence(record) : null;
  }

  public async findByLicense(licenseNumber: string): Promise<Therapist | null> {
    const db = await this.db();
    const record = await db.therapist.findUnique({
      where: { licenseNumber: licenseNumber.trim() },
    });
    return record ? Therapist.fromPersistence(record) : null;
  }

  public async insert(therapist: Therapist): Promise<Therapist> {
    const db = await this.db();
    const data = therapist.toPersistence();
    const record = await db.therapist.create({
      data: {
        id: data.id,
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        languages: data.languages,
        isVerified: data.isVerified,
        verificationStatus: data.verificationStatus,
        rejectionReason: data.rejectionReason,
        verifiedAt: data.verifiedAt,
        workingHours: data.workingHours as any,
        bio: data.bio,
        experience: data.experience,
        hourlyRate: data.hourlyRate,
        bankAccountInfo: data.bankAccountInfo as any,
      },
    });
    return Therapist.fromPersistence(record);
  }

  public async update(therapist: Therapist): Promise<Therapist> {
    const db = await this.db();
    const data = therapist.toPersistence();
    const record = await db.therapist.update({
      where: { id: data.id },
      data: {
        specialization: data.specialization,
        languages: data.languages,
        isVerified: data.isVerified,
        verificationStatus: data.verificationStatus,
        rejectionReason: data.rejectionReason,
        verifiedAt: data.verifiedAt,
        workingHours: data.workingHours as any,
        bio: data.bio,
        experience: data.experience,
        hourlyRate: data.hourlyRate,
        bankAccountInfo: data.bankAccountInfo as any,
      },
    });
    return Therapist.fromPersistence(record);
  }

  public async listByVerificationStatus(
    status: VerificationStatus,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<{ therapist: Therapist; user: { id: string; name: string; email: string } }>> {
    const db = await this.db();
    const where: Prisma.TherapistWhereInput = { verificationStatus: status };
    const [records, total] = await Promise.all([
      db.therapist.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { id: "asc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      db.therapist.count({ where }),
    ]);

    return {
      items: records.map((r) => ({
        therapist: Therapist.fromPersistence(r),
        user: r.user,
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }

  public async search(
    filters: TherapistSearchFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<{ therapist: Therapist; user: { id: string; name: string; email: string } }>> {
    const db = await this.db();

    const where: Prisma.TherapistWhereInput = {
      verificationStatus: "APPROVED",
      isVerified: true,
    };

    if (filters.specialization) {
      where.specialization = { contains: filters.specialization, mode: "insensitive" };
    }
    if (filters.language) {
      where.languages = { has: filters.language.trim().toLowerCase() };
    }
    if (filters.minRating !== undefined) {
      where.rating = { gte: filters.minRating };
    }
    if (filters.hasAvailability) {
      where.availabilitySlots = {
        some: { isBooked: false, startTime: { gte: new Date() } },
      };
    }
    if (filters.search) {
      where.OR = [
        { specialization: { contains: filters.search, mode: "insensitive" } },
        { bio: { contains: filters.search, mode: "insensitive" } },
        { user: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.TherapistOrderByWithRelationInput =
      pagination.sortBy === "experience"
        ? { experience: pagination.sortOrder ?? "desc" }
        : pagination.sortBy === "createdAt"
          ? { id: pagination.sortOrder ?? "desc" }
          : { rating: pagination.sortOrder ?? "desc" };

    const [records, total] = await Promise.all([
      db.therapist.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      db.therapist.count({ where }),
    ]);

    return {
      items: records.map((r) => ({
        therapist: Therapist.fromPersistence(r),
        user: r.user,
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit) || 1,
    };
  }
}

export const therapistRepository = new TherapistRepository();
