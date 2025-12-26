import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export class ApiClient {
  private baseUrl: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(statusCode: number): boolean {
    return (
      statusCode === 0 ||
      (statusCode >= 500 && statusCode < 600) ||
      statusCode === 429
    );
  }

  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      if (
        !this.isRetryableError(response.status) ||
        retryCount >= this.maxRetries
      ) {
        return response;
      }

      const delay = this.retryDelay * Math.pow(2, retryCount);
      await this.sleep(delay);

      return this.requestWithRetry(url, options, retryCount + 1);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await this.sleep(delay);
        return this.requestWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await this.requestWithRetry(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        if (!response.ok) {
          throw new ApplicationError(
            ErrorCode.SERVER_ERROR,
            `HTTP ${response.status}: ${response.statusText}`,
            { statusCode: response.status }
          );
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const apiError: ApiError = {
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
          details: data.details,
          code: data.code,
        };

        let errorCode = ErrorCode.SERVER_ERROR;
        if (response.status === 401) {
          errorCode = ErrorCode.UNAUTHORIZED;
        } else if (response.status === 404) {
          errorCode = ErrorCode.NOT_FOUND;
        } else if (response.status === 409) {
          errorCode = ErrorCode.CONFLICT;
        } else if (response.status === 429) {
          errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
        } else if (response.status >= 400 && response.status < 500) {
          errorCode = ErrorCode.VALIDATION_ERROR;
        }

        throw new ApplicationError(errorCode, apiError.error, {
          details: apiError.details,
          statusCode: response.status,
        });
      }

      return data;
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw normalizeError(error);
    }
  }

  async authenticatedRequest<T>(
    endpoint: string,
    idToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!idToken) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Authentication token is required",
        { statusCode: 401 }
      );
    }

    return this.request<T>(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...options.headers,
      },
    });
  }

  async get<T>(endpoint: string, idToken: string): Promise<T> {
    return this.authenticatedRequest<T>(endpoint, idToken, {
      method: "GET",
    });
  }

  async post<T>(endpoint: string, idToken: string, body: unknown): Promise<T> {
    return this.authenticatedRequest<T>(endpoint, idToken, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, idToken: string): Promise<T> {
    return this.authenticatedRequest<T>(endpoint, idToken, {
      method: "DELETE",
    });
  }

  async postUnauthenticated<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
