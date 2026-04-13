import { Request, Response, NextFunction } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export class AsyncUtils {
  /**
   * Higher-order method to wrap async route handlers and catch errors
   * @param execution Function to execute
   */
  public static wrap(execution: AsyncRequestHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      execution(req, res, next).catch(next);
    };
  }
}

export const asyncHandler = AsyncUtils.wrap;
