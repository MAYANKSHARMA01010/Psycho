import { UserRepository, userRepository } from "../repositories/UserRepository";
import { UploadService, uploadService } from "./upload.service";
import { ApiError } from "../utils/ApiError";

export interface UpdateProfilePayload {
  name?: string;
  phone?: string | null;
}

export class UserService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly uploads: UploadService = uploadService,
  ) {}

  public async getOwn(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw ApiError.unauthorized("User no longer exists");
    return { user: user.toResponse() };
  }

  public async updateProfile(userId: string, payload: UpdateProfilePayload) {
    const user = await this.users.findById(userId);
    if (!user) throw ApiError.unauthorized("User no longer exists");
    user.updateProfile(payload);
    await this.users.update(user);
    return { user: user.toResponse() };
  }

  public async setAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw ApiError.badRequest("No file provided");
    if (!file.mimetype.startsWith("image/")) {
      throw ApiError.badRequest("Avatar must be an image");
    }

    const user = await this.users.findById(userId);
    if (!user) throw ApiError.unauthorized("User no longer exists");

    const previousPublicId = user.avatarPublicId;
    const result = await this.uploads.uploadBuffer(file.buffer, {
      category: "avatar",
      ownerId: userId,
      filename: file.originalname,
      contentType: file.mimetype,
      resourceType: "image",
    });

    user.setAvatar(result.url, result.publicId);
    await this.users.update(user);

    if (previousPublicId) {
      await this.uploads.destroy(previousPublicId, "image").catch(() => undefined);
    }

    return { user: user.toResponse() };
  }

  public async removeAvatar(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw ApiError.unauthorized("User no longer exists");
    const { previousPublicId } = user.clearAvatar();
    await this.users.update(user);
    if (previousPublicId) {
      await this.uploads.destroy(previousPublicId, "image").catch(() => undefined);
    }
    return { user: user.toResponse() };
  }
}

export const userService = new UserService();
