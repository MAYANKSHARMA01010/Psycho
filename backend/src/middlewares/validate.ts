import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export class ValidationMiddleware {
  /**
   * Zod Schema Validation Middleware
   * @param schema Zod schema to validate (body, query, params)
   */
  public static validate(schema: {
    body?: z.ZodObject<any>;
    query?: z.ZodObject<any>;
    params?: z.ZodObject<any>;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          const parsed = await schema.query.parseAsync(req.query);
          Object.defineProperty(req, "query", {
            value: parsed,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
        if (schema.params) {
          const parsed = await schema.params.parseAsync(req.params);
          req.params = parsed as typeof req.params;
        }
        next();
      } catch (error: any) {
        if (error instanceof ZodError) {
          const fieldErrors = error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          }));
          return next(ApiError.validationError(fieldErrors));
        }
        next(error);
      }
    };
  }
}
