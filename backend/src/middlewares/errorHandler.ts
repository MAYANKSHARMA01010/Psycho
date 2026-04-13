import { Request, Response, NextFunction } from "express";
import * as PrismaClient from "@prisma/client";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { HttpStatus } from "../constants/httpStatus";
import { ErrorCodes } from "../constants/errorCodes";
import { env } from "../config/env";

export class ErrorMiddleware {
  /**
   * Global Error Handler Method
   */
  public static handle(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response {
    let error = err;

    // Log error using Winston
    logger.error(`${err.name}: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: res.locals.requestId,
    });

    // Handle Prisma Errors
    // Handle Prisma Errors
    if ((err as any).code && (err as any).clientVersion) {
      const prismaErr = err as any;
      switch (prismaErr.code) {
        case "P2002":
          error = ApiError.conflict("Unique constraint failed on one or more fields", ErrorCodes.PRISMA_ERROR);
          break;
        case "P2025":
          error = ApiError.notFound("Record", ErrorCodes.PRISMA_ERROR);
          break;
        case "P2003":
          error = ApiError.badRequest("Foreign key constraint failed", ErrorCodes.PRISMA_ERROR);
          break;
        default:
          error = ApiError.internal("Database error occurred");
      }
    }

    // Handle Zod Validation Errors
    if (err instanceof ZodError) {
      const fieldErrors = err.issues.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      error = ApiError.validationError(fieldErrors);
    }

    // Handle JWT Errors
    if (err instanceof JsonWebTokenError) {
      error = ApiError.unauthorized("Invalid token", ErrorCodes.INVALID_TOKEN);
    }
    if (err instanceof TokenExpiredError) {
      error = ApiError.unauthorized("Token has expired", ErrorCodes.TOKEN_EXPIRED);
    }

    // Determine Response Status and Body
    const statusCode = error instanceof ApiError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || "Internal Server Error";
    const errorCode = (error instanceof ApiError ? error.errorCode : ErrorCodes.INTERNAL_SERVER_ERROR) as any;
    const errors = error instanceof ApiError ? error.errors : [];

    const responseBody = {
      success: false,
      statusCode,
      message,
      errorCode,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
      stack: env.NODE_ENV === "development" ? (err as Error).stack : undefined,
    };

    return res.status(statusCode).json(responseBody);
  }
}
