import { Role } from "../constants/roles";
import { AvailabilitySlot } from "../entities/AvailabilitySlot";
import {
  AvailabilitySlotRepository,
  availabilitySlotRepository,
} from "../repositories/AvailabilitySlotRepository";
import {
  TherapistRepository,
  therapistRepository,
} from "../repositories/TherapistRepository";
import { ApiError } from "../utils/ApiError";

export interface CreateSlotsPayload {
  slots: Array<{ startTime: Date; endTime: Date }>;
}

export interface UpdateSlotPayload {
  startTime?: Date;
  endTime?: Date;
}

export interface ListSlotsOptions {
  from?: Date;
  to?: Date;
  onlyAvailable?: boolean;
}

export class AvailabilityService {
  constructor(
    private readonly slots: AvailabilitySlotRepository = availabilitySlotRepository,
    private readonly therapists: TherapistRepository = therapistRepository,
  ) {}

  public async createSlots(userId: string, userRole: string, payload: CreateSlotsPayload) {
    this.ensureTherapist(userRole);

    const therapist = await this.therapists.findById(userId);
    if (!therapist) {
      throw ApiError.notFound("Therapist profile");
    }

    if (!payload.slots.length) {
      throw ApiError.badRequest("At least one slot is required");
    }

    const entities = payload.slots.map((s) =>
      AvailabilitySlot.create({
        therapistId: userId,
        startTime: s.startTime,
        endTime: s.endTime,
      }),
    );

    this.assertNoSelfOverlap(entities);

    for (const slot of entities) {
      const conflict = await this.slots.findOverlapping(userId, slot.startTime, slot.endTime);
      if (conflict) {
        throw ApiError.conflict(
          `Slot ${slot.startTime.toISOString()} – ${slot.endTime.toISOString()} overlaps with an existing slot`,
        );
      }
    }

    const created = await this.slots.insertMany(entities);
    return { slots: created.map((s) => s.toResponse()) };
  }

  public async listOwnSlots(userId: string, userRole: string, options: ListSlotsOptions) {
    this.ensureTherapist(userRole);
    const slots = await this.slots.listForTherapist(userId, options);
    return { slots: slots.map((s) => s.toResponse()) };
  }

  public async listForTherapist(therapistId: string, options: ListSlotsOptions) {
    const therapist = await this.therapists.findById(therapistId);
    if (!therapist || !therapist.canAcceptBookings()) {
      throw ApiError.notFound("Therapist");
    }
    const slots = await this.slots.listForTherapist(therapistId, {
      ...options,
      onlyAvailable: true,
    });
    return { slots: slots.map((s) => s.toResponse()) };
  }

  public async updateSlot(
    userId: string,
    userRole: string,
    slotId: string,
    payload: UpdateSlotPayload,
  ) {
    this.ensureTherapist(userRole);
    const slot = await this.getOwnSlotOrFail(userId, slotId);

    slot.reschedule(payload);
    const conflict = await this.slots.findOverlapping(userId, slot.startTime, slot.endTime, slotId);
    if (conflict) {
      throw ApiError.conflict("Updated slot overlaps with an existing slot");
    }

    const saved = await this.slots.update(slot);
    return { slot: saved.toResponse() };
  }

  public async deleteSlot(userId: string, userRole: string, slotId: string) {
    this.ensureTherapist(userRole);
    const slot = await this.getOwnSlotOrFail(userId, slotId);
    slot.ensureDeletable();
    await this.slots.delete(slotId);
  }

  private async getOwnSlotOrFail(userId: string, slotId: string): Promise<AvailabilitySlot> {
    const slot = await this.slots.findById(slotId);
    if (!slot || slot.therapistId !== userId) {
      throw ApiError.notFound("Slot");
    }
    return slot;
  }

  private assertNoSelfOverlap(slots: AvailabilitySlot[]): void {
    const sorted = [...slots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].overlaps(sorted[i])) {
        throw ApiError.badRequest("Slots in the request overlap each other");
      }
    }
  }

  private ensureTherapist(role: string): void {
    if (role !== Role.THERAPIST) {
      throw ApiError.forbidden("Only therapists can manage availability");
    }
  }
}

export const availabilityService = new AvailabilityService();
