import { Content } from "@/lib/store/api";

interface ProcessingTimeResult {
  totalMinutes: number;
  totalProcessingTimeMs: number;
}

function parseTimestamp(ts: string | number | null | undefined): Date | null {
  if (!ts) return null;
  try {
    if (typeof ts === "number") {
      const threshold = 1e12;
      if (ts < threshold) {
        return new Date(ts * 1000);
      }
      return new Date(ts);
    }
    return new Date(ts);
  } catch {
    return null;
  }
}

export interface ContentStorageMetrics {
  totalFileSizeGB: number;
  totalVideoMinutes: number;
  mbPerMinute: number;
  videoCount: number;
  imageCount: number;
}

export interface ProcessingMetrics {
  totalProcessed: number;
  totalProcessing: number;
  totalFailed: number;
}

export interface ConversionTimeMetrics {
  avgConversionTimePerMinute: number;
  processedCount: number;
}

export function calculateContentStorageMetrics(
  content: Content[]
): ContentStorageMetrics {
  const processedContent = content.filter(
    (c) => c.status.toUpperCase() === "PROCESSED"
  );

  const totalFileSizeMB = processedContent.reduce(
    (sum, item) => sum + (item.fileSize || 0),
    0
  );

  const totalFileSizeGB = totalFileSizeMB / 1024;

  const videos = processedContent.filter((c) => c.contentType === "video");
  const images = processedContent.filter((c) => c.contentType === "image");

  const totalVideoMinutes = videos.reduce(
    (sum, video) => sum + (video.videoTime || 0) / 60,
    0
  );

  const mbPerMinute =
    totalVideoMinutes > 0 ? totalFileSizeMB / totalVideoMinutes : 0;

  return {
    totalFileSizeGB,
    totalVideoMinutes,
    mbPerMinute,
    videoCount: videos.length,
    imageCount: images.length,
  };
}

export function calculateProcessingMetrics(
  content: Content[]
): ProcessingMetrics {
  const processedContent = content.filter(
    (c) => c.status.toUpperCase() === "PROCESSED"
  );

  const totalProcessing = content.filter(
    (c) =>
      c.status.toUpperCase() === "PROCESSING" ||
      c.status.toUpperCase() === "UPLOADING"
  ).length;

  const totalFailed = content.filter(
    (c) => c.status.toUpperCase() === "FAILED"
  ).length;

  const totalProcessed = processedContent.length;

  return { totalProcessed, totalProcessing, totalFailed };
}

export function calculateConversionTimeMetrics(
  content: Content[]
): ConversionTimeMetrics {
  const processedVideos = content.filter(
    (c) => c.status.toUpperCase() === "PROCESSED" && c.contentType === "video"
  );

  const processingTimes: ProcessingTimeResult[] = processedVideos
    .map((video) => {
      if (
        !video.processingStartTimestamp ||
        !video.processingEndTimestamp ||
        !video.videoTime ||
        video.videoTime <= 0
      ) {
        return null;
      }

      const start = parseTimestamp(video.processingStartTimestamp);
      const end = parseTimestamp(video.processingEndTimestamp);

      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }

      const processingTimeMs = end.getTime() - start.getTime();
      const videoMinutes = video.videoTime / 60;

      return {
        totalMinutes: videoMinutes,
        totalProcessingTimeMs: processingTimeMs,
      };
    })
    .filter((result): result is ProcessingTimeResult => result !== null);

  const totalProcessingMinutes = processingTimes.reduce(
    (sum, result) => sum + result.totalMinutes,
    0
  );
  const totalProcessingTimeMs = processingTimes.reduce(
    (sum, result) => sum + result.totalProcessingTimeMs,
    0
  );

  const avgConversionTimePerMinute =
    totalProcessingMinutes > 0
      ? totalProcessingTimeMs / totalProcessingMinutes
      : 0;

  return {
    avgConversionTimePerMinute,
    processedCount: processingTimes.length,
  };
}

