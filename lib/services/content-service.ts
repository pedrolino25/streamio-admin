import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { externalApiClient } from "./external-api-client";

export interface Content {
  id: string;
  tenantId: string;
  projectId: string;
  path: string;
  contentType: "video" | "image";
  status: string;
  createdAt?: string;
  updatedAt?: string;
  videoTime?: number; // Only for videos
  fileSize?: number;
  uploadStartTimestamp?: string;
  processingStartTimestamp?: string;
  processingEndTimestamp?: string;
  configuration?: ProcessingConfiguration;
}

export interface ContentResponse {
  data: Content[];
  count: number;
}

export async function getContentByProjectName(
  apiKey: string,
  projectName: string
): Promise<Content[]> {
  try {
    const response = await externalApiClient.get<ContentResponse>(
      `/content?projectName=${encodeURIComponent(projectName)}`,
      apiKey
    );
    return response.data || [];
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.NOT_FOUND) {
      throw new ApplicationError(ErrorCode.NOT_FOUND, "Project not found", {
        details: normalizedError.details,
      });
    }

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Invalid API key. Please check your tenant API key.",
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
      "Failed to fetch content. Please try again later.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function deleteContent(
  apiKey: string,
  contentId: string
): Promise<void> {
  try {
    await externalApiClient.delete("/content", apiKey, {
      contentId,
    });
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.NOT_FOUND) {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        "Content not found. It may have already been deleted.",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.FORBIDDEN) {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        "You don't have permission to delete this content.",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.UNAUTHORIZED) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        "Invalid API key. Please check your tenant API key.",
        { details: normalizedError.details }
      );
    }

    throw new ApplicationError(
      ErrorCode.OPERATION_FAILED,
      "Failed to delete content. Please try again.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}
