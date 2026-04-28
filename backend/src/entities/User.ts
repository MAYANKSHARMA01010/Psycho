import { randomUUID } from "node:crypto";
import { Role } from "../constants/roles";
import { AuthUtils } from "../utils/AuthUtils";

export interface UserProps {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  onboardingProfile: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
  isEmailVerified?: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
}

export interface UserPersistencePayload {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  onboardingProfile: unknown;
}

export interface OnboardingProfile {
  fullName: string;
  careGoal: "stress" | "sleep" | "relationships" | "career" | "other";
  sessionStyle: "video" | "chat" | "mixed";
  reminderChannel: "email" | "whatsapp" | "none";
}

export class User {
  public readonly id: string;
  public name: string;
  public email: string;
  public phone: string | null;
  public avatarUrl: string | null;
  public avatarPublicId: string | null;
  private passwordHash: string;
  public readonly role: Role;
  public isActive: boolean;
  public isEmailVerified: boolean;
  public onboardingCompleted: boolean;
  public onboardingCompletedAt: Date | null;
  public onboardingProfile: unknown;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.avatarUrl = props.avatarUrl;
    this.avatarPublicId = props.avatarPublicId;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.isActive = props.isActive;
    this.isEmailVerified = props.isEmailVerified;
    this.onboardingCompleted = props.onboardingCompleted;
    this.onboardingCompletedAt = props.onboardingCompletedAt;
    this.onboardingProfile = props.onboardingProfile;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  public static async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await AuthUtils.hashPassword(input.password);
    const now = new Date();

    return new User({
      id: randomUUID(),
      name: input.name.trim(),
      email: User.normalizeEmail(input.email),
      phone: input.phone ?? null,
      avatarUrl: null,
      avatarPublicId: null,
      passwordHash,
      role: input.role,
      isActive: true,
      isEmailVerified: input.isEmailVerified ?? false,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingProfile: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(record: any): User {
    return new User({
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone,
      avatarUrl: record.avatarUrl ?? null,
      avatarPublicId: record.avatarPublicId ?? null,
      passwordHash: record.passwordHash,
      role: record.role as Role,
      isActive: record.isActive,
      isEmailVerified: record.isEmailVerified,
      onboardingCompleted: record.onboardingCompleted,
      onboardingCompletedAt: record.onboardingCompletedAt,
      onboardingProfile: record.onboardingProfile,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public updateProfile(input: UpdateProfileInput): void {
    if (input.name !== undefined) this.name = input.name.trim();
    if (input.phone !== undefined) this.phone = input.phone ? input.phone.trim() : null;
    this.touch();
  }

  public setAvatar(url: string, publicId: string): void {
    this.avatarUrl = url;
    this.avatarPublicId = publicId;
    this.touch();
  }

  public clearAvatar(): { previousPublicId: string | null } {
    const previousPublicId = this.avatarPublicId;
    this.avatarUrl = null;
    this.avatarPublicId = null;
    this.touch();
    return { previousPublicId };
  }

  public async verifyPassword(plaintext: string): Promise<boolean> {
    return AuthUtils.comparePassword(plaintext, this.passwordHash);
  }

  public async setPassword(newPassword: string): Promise<void> {
    this.passwordHash = await AuthUtils.hashPassword(newPassword);
    this.touch();
  }

  public markEmailVerified(): void {
    if (this.isEmailVerified) return;
    this.isEmailVerified = true;
    this.touch();
  }

  public deactivate(): void {
    this.isActive = false;
    this.touch();
  }

  public completeOnboarding(profile: OnboardingProfile): void {
    this.name = profile.fullName.trim();
    this.onboardingCompleted = true;
    this.onboardingCompletedAt = new Date();
    this.onboardingProfile = profile;
    this.touch();
  }

  public toResponse(): UserResponse {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      role: this.role,
      isEmailVerified: this.isEmailVerified,
      onboardingCompleted: this.onboardingCompleted,
    };
  }

  public toPersistence(): UserPersistencePayload {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      avatarPublicId: this.avatarPublicId,
      passwordHash: this.passwordHash,
      role: this.role,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      onboardingCompleted: this.onboardingCompleted,
      onboardingCompletedAt: this.onboardingCompletedAt,
      onboardingProfile: this.onboardingProfile,
    };
  }

  public getTokenPayload() {
    return {
      id: this.id,
      role: this.role,
      isActive: this.isActive,
    };
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
