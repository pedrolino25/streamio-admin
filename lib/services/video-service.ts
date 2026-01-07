import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { externalApiClient } from "./external-api-client";

export interface Video {
  id: string;
  tenantId: string;
  projectId: string;
  path: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  videoTime?: number;
  fileSize?: number;
  uploadStartTimestamp?: string;
  processingStartTimestamp?: string;
  processingEndTimestamp?: string;
  configuration?: ProcessingConfiguration;
}

export interface VideosResponse {
  data: Video[];
  count: number;
}

export async function getVideosByProjectName(
  apiKey: string,
  projectName: string
): Promise<Video[]> {
  try {
    const response = await externalApiClient.get<VideosResponse>(
      `/videos?projectName=${encodeURIComponent(projectName)}`,
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
      "Failed to fetch videos. Please try again later.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}

export async function deleteVideo(
  apiKey: string,
  videoId: string
): Promise<void> {
  try {
    await externalApiClient.delete("/video", apiKey, {
      videoId,
    });
  } catch (error) {
    const normalizedError = normalizeError(error);

    if (normalizedError.code === ErrorCode.NOT_FOUND) {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        "Video not found. It may have already been deleted.",
        { details: normalizedError.details }
      );
    }

    if (normalizedError.code === ErrorCode.FORBIDDEN) {
      throw new ApplicationError(
        ErrorCode.FORBIDDEN,
        "You don't have permission to delete this video.",
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
      "Failed to delete video. Please try again.",
      { details: normalizedError.message, originalError: normalizedError }
    );
  }
}
