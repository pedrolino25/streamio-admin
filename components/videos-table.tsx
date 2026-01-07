"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Video } from "@/lib/store/api";
import {
  formatDate,
  formatElapsedProcessingTime,
  formatProcessingDuration,
} from "@/lib/utils/date-utils";
import { Film, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { VideoPlaybackTestDialog } from "./video-playback-test-dialog";

interface VideosTableProps {
  videos: Video[];
  apiKey: string;
  projectName: string;
}

function ProcessingTimeDisplay({
  startTimestamp,
  endTimestamp,
}: {
  startTimestamp?: string | number | null;
  endTimestamp?: string | number | null;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startTimestamp || endTimestamp) {
      // No processing or finished - no need to update
      return;
    }

    // Processing ongoing - update elapsed time periodically
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp, endTimestamp]);

  if (!startTimestamp) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (endTimestamp) {
    // Processing finished - compute directly
    return (
      <span>{formatProcessingDuration(startTimestamp, endTimestamp)}</span>
    );
  }

  // Processing ongoing - compute on each render
  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {formatElapsedProcessingTime(startTimestamp)}
    </span>
  );
}

export function VideosTable({ videos, apiKey, projectName }: VideosTableProps) {
  const [testPlaybackOpen, setTestPlaybackOpen] = useState(false);
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(
    null
  );

  const handlePlayVideo = (videoPath: string) => {
    setSelectedVideoPath(videoPath);
    setTestPlaybackOpen(true);
  };

  const getStatusVariant = (
    status: Video["status"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "PROCESSED":
        return "default";
      case "PROCESSING":
      case "UPLOADING":
        return "secondary";
      case "FAILED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatFileSize = (sizeMB?: number): string => {
    if (!sizeMB) return "—";
    if (sizeMB < 1) {
      return `${(sizeMB * 1024).toFixed(2)} KB`;
    }
    return `${sizeMB.toFixed(2)} MB`;
  };

  const formatVideoTime = (seconds?: number): string => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours} h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`);
    }
    if (secs > 0 && hours === 0) {
      // Only show seconds if less than an hour
      parts.push(`${secs} sec`);
    }

    return parts.length > 0 ? parts.join(" ") : "0 sec";
  };

  const formatConfiguration = (config?: Video["configuration"]): string => {
    if (!config) return "—";

    const parts: string[] = [];
    if (config.videoQuality) {
      parts.push(`Quality: ${config.videoQuality}`);
    }
    if (config.maxResolution) {
      parts.push(`Res: ${config.maxResolution}`);
    }
    if (config.thumbnailImage) {
      parts.push(`Thumb: ${config.thumbnailImage}`);
    }
    if (config.previewImages) {
      parts.push("Previews");
    }

    return parts.length > 0 ? parts.join(", ") : "—";
  };

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<Film className="h-6 w-6 text-muted-foreground" />}
        title="No videos found"
        description="Videos uploaded for this project will appear here."
      />
    );
  }

  return (
    <div className="divide-y">
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Video ID
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Status
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Path
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Duration
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                File Size
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Upload Started
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Processing
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Configuration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow
                key={video.id}
                className="border-b bg-card transition-colors hover:bg-muted/50"
              >
                <TableCell className="px-4 py-4 sm:px-6">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {video.id}
                  </code>
                </TableCell>
                <TableCell className="px-4 py-4 sm:px-6">
                  <div className="flex justify-center">
                    {video.status.toUpperCase() === "PROCESSED" &&
                    video.path ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-muted"
                        onClick={() => handlePlayVideo(video.path)}
                        title="Play video"
                        aria-label={`Play video ${video.path}`}
                      >
                        <Play className="h-4 w-4" aria-hidden="true" />
                        Play video
                      </Button>
                    ) : (
                      <Badge variant={getStatusVariant(video.status)}>
                        {video.status}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 sm:px-6">
                  {video.path ? (
                    <code className="max-w-xs truncate rounded bg-muted px-2 py-1 font-mono text-xs text-foreground sm:max-w-md">
                      {video.path}
                    </code>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-foreground sm:px-6">
                  {formatVideoTime(video.videoTime)}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-foreground sm:px-6">
                  {formatFileSize(video.fileSize)}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  {formatDate(video.uploadStartTimestamp)}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  <ProcessingTimeDisplay
                    startTimestamp={video.processingStartTimestamp}
                    endTimestamp={video.processingEndTimestamp}
                  />
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  <span className="max-w-xs truncate block">
                    {formatConfiguration(video.configuration)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="block space-y-4 p-4 md:hidden sm:p-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {video.id}
                  </code>
                </div>
                {video.status.toUpperCase() === "PROCESSED" && video.path ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 hover:bg-muted"
                    onClick={() => handlePlayVideo(video.path)}
                    title="Play video"
                    aria-label={`Play video ${video.path}`}
                  >
                    <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                    Play video
                  </Button>
                ) : (
                  <Badge
                    variant={getStatusVariant(video.status)}
                    className="ml-2 shrink-0"
                  >
                    {video.status}
                  </Badge>
                )}
              </div>
              {video.path && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Path
                  </p>
                  <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {video.path}
                  </code>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Duration
                  </p>
                  <p className="text-sm text-foreground">
                    {formatVideoTime(video.videoTime)}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    File Size
                  </p>
                  <p className="text-sm text-foreground">
                    {formatFileSize(video.fileSize)}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Upload Started
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(video.uploadStartTimestamp)}
                </p>
              </div>
              {video.processingStartTimestamp && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Processing
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <ProcessingTimeDisplay
                      startTimestamp={video.processingStartTimestamp}
                      endTimestamp={video.processingEndTimestamp}
                    />
                  </p>
                </div>
              )}
              {video.configuration && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Configuration
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatConfiguration(video.configuration)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <VideoPlaybackTestDialog
        open={testPlaybackOpen}
        onOpenChange={(open) => {
          setTestPlaybackOpen(open);
          if (!open) {
            setSelectedVideoPath(null);
          }
        }}
        apiKey={apiKey}
        initialVideoPath={selectedVideoPath || undefined}
        projectName={projectName}
      />
    </div>
  );
}
