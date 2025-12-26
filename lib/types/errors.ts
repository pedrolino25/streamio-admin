export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  PROJECT_EXISTS = "PROJECT_EXISTS",
  PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
  OPERATION_FAILED = "OPERATION_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  statusCode?: number;
  originalError?: unknown;
}

export class ApplicationError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly details?: string;
  public readonly statusCode?: number;
  public readonly originalError?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      details?: string;
      statusCode?: number;
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.details = options?.details;
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
    };
  }
}

export const ErrorFactory = {
  unauthorized: (message = "Unauthorized access", details?: string) =>
    new ApplicationError(ErrorCode.UNAUTHORIZED, message, {
      details,
      statusCode: 401,
    }),

  tokenExpired: (message = "Token has expired", details?: string) =>
    new ApplicationError(ErrorCode.TOKEN_EXPIRED, message, {
      details,
      statusCode: 401,
    }),

  invalidCredentials: (
    message = "Invalid email or password",
    details?: string
  ) =>
    new ApplicationError(ErrorCode.INVALID_CREDENTIALS, message, {
      details,
      statusCode: 401,
    }),

  validationError: (message: string, details?: string) =>
    new ApplicationError(ErrorCode.VALIDATION_ERROR, message, {
      details,
      statusCode: 400,
    }),

  notFound: (message = "Resource not found", details?: string) =>
    new ApplicationError(ErrorCode.NOT_FOUND, message, {
      details,
      statusCode: 404,
    }),

  conflict: (message: string, details?: string) =>
    new ApplicationError(ErrorCode.CONFLICT, message, {
      details,
      statusCode: 409,
    }),

  networkError: (
    message = "Network request failed",
    details?: string,
    originalError?: unknown
  ) =>
    new ApplicationError(ErrorCode.NETWORK_ERROR, message, {
      details,
      statusCode: 0,
      originalError,
    }),

  serverError: (
    message = "Internal server error",
    details?: string,
    originalError?: unknown
  ) =>
    new ApplicationError(ErrorCode.SERVER_ERROR, message, {
      details,
      statusCode: 500,
      originalError,
    }),

  unknown: (
    message = "An unknown error occurred",
    details?: string,
    originalError?: unknown
  ) =>
    new ApplicationError(ErrorCode.UNKNOWN_ERROR, message, {
      details,
      originalError,
    }),
};

export function normalizeError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof Error) {
    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("401")
    ) {
      return ErrorFactory.unauthorized(error.message);
    }

    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return ErrorFactory.networkError(error.message, undefined, error);
    }

    return ErrorFactory.unknown(error.message, undefined, error);
  }

  return ErrorFactory.unknown(
    "An unexpected error occurred",
    String(error),
    error
  );
}
