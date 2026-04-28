import { type Request, type Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { userService } from "../services/user.service";

export class UserController {
  public async getMe(req: Request, res: Response) {
    const data = await userService.getOwn(req.user!.id);
    return ApiResponse.success(res, 200, "User fetched", data);
  }

  public async updateMe(req: Request, res: Response) {
    const data = await userService.updateProfile(req.user!.id, req.body);
    return ApiResponse.success(res, 200, "Profile updated", data);
  }

  public async uploadAvatar(req: Request, res: Response) {
    const data = await userService.setAvatar(req.user!.id, req.file as Express.Multer.File);
    return ApiResponse.success(res, 200, "Avatar updated", data);
  }

  public async removeAvatar(req: Request, res: Response) {
    const data = await userService.removeAvatar(req.user!.id);
    return ApiResponse.success(res, 200, "Avatar removed", data);
  }
}

export const userController = new UserController();
