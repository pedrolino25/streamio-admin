import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { transformApiError } from "./error-transformer";

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
};

function calculateRetryDelay(baseDelay: number, retryCount: number): number {
  return baseDelay * Math.pow(2, retryCount);
}

function isRetryableError(statusCode: number): boolean {
  return (
    statusCode === 0 ||
    (statusCode >= 500 && statusCode < 600) ||
    statusCode === 429
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig,
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (
      !isRetryableError(response.status) ||
      retryCount >= retryConfig.maxRetries
    ) {
      return response;
    }

    const delay = calculateRetryDelay(retryConfig.baseDelay, retryCount);
    await sleep(delay);

    return requestWithRetry(url, options, retryConfig, retryCount + 1);
  } catch (error) {
    if (retryCount < retryConfig.maxRetries) {
      const delay = calculateRetryDelay(retryConfig.baseDelay, retryCount);
      await sleep(delay);
      return requestWithRetry(url, options, retryConfig, retryCount + 1);
    }
    throw error;
  }
}

async function request<T>(
  endpoint: string,
  baseUrl: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await requestWithRetry(
      url,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      retryConfig
    );

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
      throw transformApiError(response, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    throw normalizeError(error);
  }
}

function authenticatedRequest<T>(
  endpoint: string,
  idToken: string,
  baseUrl: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  if (!idToken) {
    throw new ApplicationError(
      ErrorCode.UNAUTHORIZED,
      "Authentication token is required",
      { statusCode: 401 }
    );
  }

  return request<T>(
    endpoint,
    baseUrl,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...options.headers,
      },
    },
    retryConfig
  );
}

export async function get<T>(
  endpoint: string,
  idToken: string,
  baseUrl: string = ""
): Promise<T> {
  return authenticatedRequest<T>(endpoint, idToken, baseUrl, {
    method: "GET",
  });
}

export async function post<T>(
  endpoint: string,
  idToken: string,
  body: unknown,
  baseUrl: string = ""
): Promise<T> {
  return authenticatedRequest<T>(endpoint, idToken, baseUrl, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteRequest<T>(
  endpoint: string,
  idToken: string,
  baseUrl: string = ""
): Promise<T> {
  return authenticatedRequest<T>(endpoint, idToken, baseUrl, {
    method: "DELETE",
  });
}

export async function postUnauthenticated<T>(
  endpoint: string,
  body: unknown,
  baseUrl: string = ""
): Promise<T> {
  return request<T>(
    endpoint,
    baseUrl,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export const apiClient = {
  get,
  post,
  delete: deleteRequest,
  postUnauthenticated,
};
