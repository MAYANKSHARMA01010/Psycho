import { DatabaseService } from "../config/database";
import { Role } from "../constants/roles";
import { User } from "../entities/User";

export class UserRepository {
  private async db() {
    return DatabaseService.getInstance();
  }

  public async findById(id: string): Promise<User | null> {
    const db = await this.db();
    const record = await db.user.findUnique({ where: { id } });
    return record ? User.fromPersistence(record as any) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const db = await this.db();
    const record = await db.user.findUnique({
      where: { email: User.normalizeEmail(email) },
    });
    return record ? User.fromPersistence(record as any) : null;
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const db = await this.db();
    const record = await db.user.findUnique({
      where: { email: User.normalizeEmail(email) },
      select: { id: true },
    });
    return Boolean(record);
  }

  public async insert(user: User): Promise<User> {
    const db = await this.db();
    const data = user.toPersistence();
    const record = await db.user.create({
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        avatarPublicId: data.avatarPublicId ?? undefined,
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: data.isActive,
        isEmailVerified: data.isEmailVerified,
        onboardingCompleted: data.onboardingCompleted,
        onboardingCompletedAt: data.onboardingCompletedAt ?? undefined,
        onboardingProfile: (data.onboardingProfile ?? undefined) as any,
      },
    });
    return User.fromPersistence(record as any);
  }

  public async update(user: User): Promise<User> {
    const db = await this.db();
    const data = user.toPersistence();
    const record = await db.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        avatarPublicId: data.avatarPublicId,
        passwordHash: data.passwordHash,
        isActive: data.isActive,
        isEmailVerified: data.isEmailVerified,
        onboardingCompleted: data.onboardingCompleted,
        onboardingCompletedAt: data.onboardingCompletedAt,
        onboardingProfile: data.onboardingProfile as any,
      },
    });
    return User.fromPersistence(record as any);
  }

  public async ensureRoleProfile(userId: string, role: Role): Promise<void> {
    const db = await this.db();

    if (role === Role.CLIENT) {
      await db.client.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
      });
    }

    if (role === Role.ADMIN) {
      await db.admin.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
      });
    }
  }
}

export const userRepository = new UserRepository();
