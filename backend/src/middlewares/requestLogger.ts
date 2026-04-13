import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

export class LogMiddleware {
  /**
   * Request logging middleware using Morgan and Winston
   */
  public static handle() {
    return [
      // Attach Request ID to response locals and headers
      (req: Request, res: Response, next: NextFunction) => {
        const requestId = uuidv4();
        res.locals.requestId = requestId;
        res.setHeader("X-Request-Id", requestId);
        next();
      },
      // Use Morgan for formatting logs
      morgan(
        ":method :url :status :res[content-length] - :response-time ms",
        {
          stream: {
            write: (message: string) => logger.info(message.trim()),
          },
        }
      ),
    ];
  }
}
