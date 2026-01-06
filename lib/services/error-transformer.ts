import { ApplicationError, ErrorCode } from "@/lib/types/errors";

interface ApiErrorResponse {
  error?: string;
  details?: string;
  code?: string;
}

export function mapHttpStatusToErrorCode(status: number): ErrorCode {
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 404) return ErrorCode.NOT_FOUND;
  if (status === 409) return ErrorCode.CONFLICT;
  if (status === 429) return ErrorCode.RATE_LIMIT_EXCEEDED;
  if (status >= 400 && status < 500) return ErrorCode.VALIDATION_ERROR;
  return ErrorCode.SERVER_ERROR;
}

export function transformApiError(
  response: Response,
  data?: ApiErrorResponse
): ApplicationError {
  const errorCode = mapHttpStatusToErrorCode(response.status);
  const errorMessage =
    data?.error || `HTTP ${response.status}: ${response.statusText}`;

  return new ApplicationError(errorCode, errorMessage, {
    details: data?.details,
    statusCode: response.status,
  });
}
