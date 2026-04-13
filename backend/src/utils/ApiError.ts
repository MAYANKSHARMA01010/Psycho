import { HttpStatus } from "../constants/httpStatus";
import { ErrorCodes, ErrorCode } from "../constants/errorCodes";

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public statusCode: number;
  public errorCode: ErrorCode;
  public errors: FieldError[];
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errorCode: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR,
    errors: FieldError[] = [],
    isOperational = true,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, errorCode: ErrorCode = ErrorCodes.VALIDATION_ERROR, errors: FieldError[] = []) {
    return new ApiError(HttpStatus.BAD_REQUEST, message, errorCode, errors);
  }

  static unauthorized(message = "Unauthorized access", errorCode: ErrorCode = ErrorCodes.UNAUTHORIZED) {
    return new ApiError(HttpStatus.UNAUTHORIZED, message, errorCode);
  }

  static forbidden(message = "Forbidden access", errorCode: ErrorCode = ErrorCodes.FORBIDDEN) {
    return new ApiError(HttpStatus.FORBIDDEN, message, errorCode);
  }

  static notFound(resource = "Resource", errorCode: ErrorCode = ErrorCodes.NOT_FOUND) {
    return new ApiError(HttpStatus.NOT_FOUND, `${resource} not found`, errorCode);
  }

  static conflict(message: string, errorCode: ErrorCode = ErrorCodes.CONFLICT) {
    return new ApiError(HttpStatus.CONFLICT, message, errorCode);
  }

  static internal(message = "Internal server error") {
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message, ErrorCodes.INTERNAL_SERVER_ERROR);
  }

  static validationError(errors: FieldError[]) {
    return new ApiError(HttpStatus.BAD_REQUEST, "Validation failed", ErrorCodes.VALIDATION_ERROR, errors);
  }
}
