"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Video } from "@/lib/store/api";
import { Database, PlayCircle, Timer } from "lucide-react";

interface ProjectMetricsCardsProps {
  videos: Video[];
}

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
        // Unix timestamp in seconds
        return new Date(ts * 1000);
      }
      return new Date(ts);
    }
    return new Date(ts);
  } catch {
    return null;
  }
}

export function ProjectMetricsCards({ videos }: ProjectMetricsCardsProps) {
  // Card 1: Total video storage (only processed videos)
  const processedVideos = videos.filter(
    (v) => v.status.toUpperCase() === "PROCESSED"
  );

  const totalFileSizeMB = processedVideos.reduce((sum, video) => {
    return sum + (video.fileSize || 0);
  }, 0);

  const totalFileSizeGB = totalFileSizeMB / 1024;

  const totalVideoMinutes = processedVideos.reduce((sum, video) => {
    const minutes = (video.videoTime || 0) / 60;
    return sum + minutes;
  }, 0);

  const mbPerMinute =
    totalVideoMinutes > 0 ? totalFileSizeMB / totalVideoMinutes : 0;

  // Card 2: Processing metrics
  const totalProcessing = videos.filter(
    (v) =>
      v.status.toUpperCase() === "PROCESSING" ||
      v.status.toUpperCase() === "UPLOADING"
  ).length;

  const totalFailed = videos.filter(
    (v) => v.status.toUpperCase() === "FAILED"
  ).length;

  const totalProcessed = processedVideos.length;

  // Card 3: Average conversion time per minute
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

  const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 0) return "—";
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="grid gap-2 md:grid-cols-3">
      {/* Card 1: Total Video Storage */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Video Storage
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Processed videos only
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-card p-3 sm:p-4">
          <div className="space-y-2">
            <div>
              <p className="text-xl font-bold text-foreground">
                {totalFileSizeGB.toFixed(2)} GB
              </p>
              <p className="text-xs text-muted-foreground">Total storage</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-base font-semibold text-foreground">
                {totalVideoMinutes.toFixed(2)} min
              </p>
              <p className="text-xs text-muted-foreground">
                Total video duration
              </p>
            </div>
            <div className="border-t pt-2">
              <p className="text-base font-semibold text-foreground">
                {mbPerMinute.toFixed(2)} MB/min
              </p>
              <p className="text-xs text-muted-foreground">
                Storage per minute
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Processing Metrics */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <PlayCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Processing
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Video processing status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-card p-3 sm:p-4">
          <div className="space-y-2">
            <div>
              <p className="text-xl font-bold text-foreground">
                {totalProcessed}
              </p>
              <p className="text-xs text-muted-foreground">Total processed</p>
            </div>
            <div className="border-t pt-2">
              <p className="text-base font-semibold text-foreground">
                {totalProcessing}
              </p>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </div>
            <div className="border-t pt-2">
              <p className="text-base font-semibold text-destructive">
                {totalFailed}
              </p>
              <p className="text-xs text-muted-foreground">Total failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Average Conversion Time */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Timer className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Conversion Time
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Per minute of video
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-card p-3 sm:p-4">
          <div className="space-y-2">
            <div>
              <p className="text-xl font-bold text-foreground">
                {avgConversionTimePerMinute > 0
                  ? formatDuration(avgConversionTimePerMinute)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Average conversion time
              </p>
            </div>
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">
                Based on {processingTimes.length} processed{" "}
                {processingTimes.length === 1 ? "video" : "videos"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
