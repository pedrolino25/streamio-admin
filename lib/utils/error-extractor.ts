import { ApplicationError, ErrorCode } from "@/lib/types/errors";

interface RtkQueryErrorData {
  code?: ErrorCode;
  message?: string;
  details?: string;
  status?: number;
}

interface RtkQueryError {
  data?: RtkQueryErrorData;
  status?: number;
}

export function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (error && typeof error === "object" && "data" in error) {
    const errorData = (error as { data?: unknown }).data;
    if (errorData && typeof errorData === "object") {
      if ("message" in errorData) {
        return String(errorData.message);
      }
      if ("error" in errorData) {
        return String(errorData.error);
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

export function transformRtkQueryError(error: unknown): ApplicationError {
  if (error && typeof error === "object" && "data" in error) {
    const rtkError = error as RtkQueryError;
    if (rtkError.data && typeof rtkError.data === "object") {
      const errorData = rtkError.data;
      return new ApplicationError(
        errorData.code || ErrorCode.OPERATION_FAILED,
        errorData.message || "Operation failed",
        {
          details: errorData.details,
          statusCode: errorData.status,
        }
      );
    }
  }

  return new ApplicationError(
    ErrorCode.OPERATION_FAILED,
    error instanceof Error ? error.message : "Operation failed",
    { originalError: error }
  );
}
