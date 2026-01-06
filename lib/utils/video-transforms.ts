import { ProcessingConfiguration } from "@/lib/schemas/upload-schemas";
import { logger } from "@/lib/services/logger";

export interface VideoData {
  id: string;
  project_id: string;
  path?: string;
  status: "UPLOADING" | "PROCESSING" | "FAILED" | "PROCESSED";
  video_time?: number;
  file_size?: number;
  upload_start_timestamp?: string;
  processing_start_timestamp?: string;
  processing_end_timestamp?: string;
  configuration?: ProcessingConfiguration | string;
}

export interface ParsedVideo {
  id: string;
  project_id: string;
  path?: string;
  status: "UPLOADING" | "PROCESSING" | "FAILED" | "PROCESSED";
  video_time?: number;
  file_size?: number;
  upload_start_timestamp?: string;
  processing_start_timestamp?: string;
  processing_end_timestamp?: string;
  configuration?: ProcessingConfiguration;
}

export function parseVideoConfiguration(video: VideoData): ParsedVideo {
  if (!video.configuration || typeof video.configuration !== "string") {
    return video as ParsedVideo;
  }

  try {
    return {
      ...video,
      configuration: JSON.parse(video.configuration) as ProcessingConfiguration,
    };
  } catch (error) {
    logger.warn("Failed to parse video configuration", {
      videoId: video.id,
      configuration: video.configuration,
      error,
    });
    const { ...rest } = video;
    return rest as ParsedVideo;
  }
}

export function sortVideosByUploadDate(videos: ParsedVideo[]): ParsedVideo[] {
  return [...videos].sort((a, b) => {
    const aTimestamp = a.upload_start_timestamp
      ? new Date(a.upload_start_timestamp).getTime()
      : 0;
    const bTimestamp = b.upload_start_timestamp
      ? new Date(b.upload_start_timestamp).getTime()
      : 0;

    return bTimestamp - aTimestamp;
  });
}
