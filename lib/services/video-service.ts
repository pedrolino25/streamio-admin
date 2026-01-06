import {
  ApplicationError,
  ErrorCode,
  normalizeError,
} from "@/lib/types/errors";
import { apiClient } from "./api-client";

export interface Video {
  id: string;
  project_id: string; // This field stores the project name
  path?: string;
  status: "UPLOADING" | "PROCESSING" | "FAILED" | "PROCESSED";
  video_time?: number;
  file_size?: number;
  upload_start_timestamp?: string;
  processing_start_timestamp?: string;
  processing_end_timestamp?: string;
}

export class VideoService {
  async getVideosByProjectId(
    idToken: string,
    projectId: string
  ): Promise<Video[]> {
    try {
      if (!projectId?.trim()) {
        throw new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          "Project ID is required"
        );
      }

      return await apiClient.get<Video[]>(
        `/api/projects/${projectId}/videos`,
        idToken
      );
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
        "Failed to fetch videos. Please try again later.",
        { details: normalizedError.message, originalError: error }
      );
    }
  }
}

export const videoService = new VideoService();
