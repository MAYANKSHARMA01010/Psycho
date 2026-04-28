import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptions } from "./config/corsOptions";
import { LogMiddleware } from "./middlewares/requestLogger";
import { RateLimitMiddleware } from "./middlewares/rateLimiter";
import { ErrorMiddleware } from "./middlewares/errorHandler";
import { ApiResponse } from "./utils/ApiResponse";
import { ApiError } from "./utils/ApiError";
import { Routes } from "./interfaces/route.interface";

export class App {
  public express: express.Application;

  constructor(routes: Routes[]) {
    this.express = express();
    this.setMiddlewares();
    this.setRoutes(routes);
    this.setErrorHandlers();
  }

  private setMiddlewares(): void {
    // 1. helmet()
    this.express.use(helmet());

    // 2. cors(corsOptions)
    this.express.use(cors(corsOptions));

    // 3. express.json({ limit: "10mb" }) — skip for Stripe webhook so it can verify raw body
    const RAW_BODY_PATHS = new Set<string>(["/api/v1/payments/webhook"]);
    this.express.use((req, res, next) => {
      if (RAW_BODY_PATHS.has(req.originalUrl.split("?")[0])) return next();
      return express.json({ limit: "10mb" })(req, res, next);
    });

    // 4. express.urlencoded({ extended: true })
    this.express.use(express.urlencoded({ extended: true }));

    // 5. requestLogger middleware
    this.express.use(LogMiddleware.handle());

    // 6. rateLimiter (100 req/15min per IP globally)
    this.express.use(RateLimitMiddleware.handle());
  }

  private setRoutes(routes: Routes[]): void {
    this.express.get("/", (req: Request, res: Response) => {
      return ApiResponse.success(res, 200, "Zenora backend is running", {
        name: "Zenora API",
        version: "v1",
        docs: "/api/v1/health",
      });
    });

    this.express.get("/favicon.ico", (req: Request, res: Response) => {
      return res.status(204).end();
    });

    // 7. /api/v1/health route
    this.express.get("/api/v1/health", (req: Request, res: Response) => {
      return ApiResponse.success(res, 200, "MentalCare API is healthy", {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    routes.forEach((route) => {
      this.express.use(route.path, route.router);
    });
  }

  private setErrorHandlers(): void {
    // 9. 404 handler for unmatched routes
    this.express.use((req: Request, res: Response, next: NextFunction) => {
      next(ApiError.notFound(`Route ${req.originalUrl}`));
    });

    // 10. Global errorHandler (must be last)
    this.express.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      ErrorMiddleware.handle(err, req, res, next);
    });
  }
}

