export * from "../constants/roles";
export * from "../constants/httpStatus";
export * from "../constants/errorCodes";

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  requestId?: string;
}
