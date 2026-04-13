import { Request, Response, NextFunction } from "express";
import { AuthUtils } from "../utils/AuthUtils";
import { ApiError } from "../utils/ApiError";
import { DatabaseService } from "../config/database";
import { AsyncUtils } from "../utils/asyncHandler";
import { Role } from "../constants/roles";

export class AuthMiddleware {
  /**
   * JWT Authentication Middleware
   */
  public static authenticate = AsyncUtils.wrap(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Authentication token missing");
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = AuthUtils.verifyToken(token);

      const db = await DatabaseService.getInstance();
      const user = await db.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, isActive: true },
      });

      if (!user) {
        throw ApiError.unauthorized("User no longer exists");
      }

      if (!user.isActive) {
        throw ApiError.unauthorized("User account is inactive");
      }

      // Explicitly cast to any to satisfy the extended Request type
      (req as any).user = user;
      next();
    } catch (error) {
      throw ApiError.unauthorized("Invalid or expired token");
    }
  });

  /**
   * Role-based Authorization Middleware
   * @param roles Array of allowed roles
   */
  public static authorize(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      if (!roles.includes(req.user.role as Role)) {
        return next(ApiError.forbidden("You do not have permission to access this resource"));
      }

      next();
    }}

  }