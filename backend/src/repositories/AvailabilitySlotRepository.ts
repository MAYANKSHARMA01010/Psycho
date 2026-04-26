import { DatabaseService } from "../config/database";
import { AvailabilitySlot } from "../entities/AvailabilitySlot";

export class AvailabilitySlotRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findById(id: string): Promise<AvailabilitySlot | null> {
    const db = await this.db();
    const record = await db.availabilitySlot.findUnique({ where: { id } });
    return record ? AvailabilitySlot.fromPersistence(record) : null;
  }

  public async listForTherapist(
    therapistId: string,
    options: { from?: Date; to?: Date; onlyAvailable?: boolean } = {},
  ): Promise<AvailabilitySlot[]> {
    const db = await this.db();
    const records = await db.availabilitySlot.findMany({
      where: {
        therapistId,
        ...(options.from || options.to
          ? {
              startTime: {
                ...(options.from ? { gte: options.from } : {}),
                ...(options.to ? { lte: options.to } : {}),
              },
            }
          : {}),
        ...(options.onlyAvailable ? { isBooked: false } : {}),
      },
      orderBy: { startTime: "asc" },
    });
    return records.map(AvailabilitySlot.fromPersistence);
  }

  public async findOverlapping(
    therapistId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<AvailabilitySlot | null> {
    const db = await this.db();
    const record = await db.availabilitySlot.findFirst({
      where: {
        therapistId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    return record ? AvailabilitySlot.fromPersistence(record) : null;
  }

  public async insertMany(slots: AvailabilitySlot[]): Promise<AvailabilitySlot[]> {
    const db = await this.db();
    const created = await db.$transaction(
      slots.map((slot) =>
        db.availabilitySlot.create({
          data: {
            id: slot.id,
            therapistId: slot.therapistId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: slot.isBooked,
          },
        }),
      ),
    );
    return created.map(AvailabilitySlot.fromPersistence);
  }

  public async update(slot: AvailabilitySlot): Promise<AvailabilitySlot> {
    const db = await this.db();
    const record = await db.availabilitySlot.update({
      where: { id: slot.id },
      data: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked,
      },
    });
    return AvailabilitySlot.fromPersistence(record);
  }

  public async delete(id: string): Promise<void> {
    const db = await this.db();
    await db.availabilitySlot.delete({ where: { id } });
  }
}

export const availabilitySlotRepository = new AvailabilitySlotRepository();
