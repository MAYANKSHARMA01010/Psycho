import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse<T> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T | null;
  public meta?: PaginationMeta;
  public timestamp: string;
  public requestId?: string;

  constructor(
    statusCode: number,
    message = "Operation successful",
    data: T | null = null,
    meta?: PaginationMeta,
    requestId?: string
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }

  static success<T>(res: Response, statusCode = 200, message = "Operation successful", data: T | null = null, meta?: PaginationMeta) {
    const response = new ApiResponse(statusCode, message, data, meta, res.locals.requestId);
    return res.status(statusCode).json(response);
  }
}