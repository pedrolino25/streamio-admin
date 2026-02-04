import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { externalApiClient } from "./external-api-client";

export interface Tenant {
  id: string;
  api_key: string;
  organization: string;
  status: string;
}

export interface CreateTenantRequest {
  organization: string;
}

export interface CreateTenantResponse {
  id: string;
  api_key: string;
  organization: string;
  status: string;
}

export async function getAllTenants(idToken: string): Promise<Tenant[]> {
  try {
    return await externalApiClient.get<Tenant[]>("/tenants", idToken);
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Your session has expired. Please sign in again.",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.NETWORK_ERROR) {
      throw new ApplicationError(
        ErrorCode.NETWORK_ERROR,
        "Unable to connect to the server. Please check your internet connection.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to fetch tenants. Please try again later.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function createTenant(
  idToken: string,
  data: CreateTenantRequest
): Promise<CreateTenantResponse> {
  try {
    return await externalApiClient.post<CreateTenantResponse>(
      "/tenants",
      idToken,
      data
    );
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.CONFLICT) {
      throw new ApplicationError(
        ErrorCode.CONFLICT,
        "A tenant with this organization name already exists",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.VALIDATION_ERROR) {
      throw normalizedError;
    }

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Your session has expired. Please sign in again.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to create tenant. Please try again.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

