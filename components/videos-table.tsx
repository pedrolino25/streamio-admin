"use client";

import { Badge } from "@/components/ui/badge";
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
import { Video } from "@/lib/services/video-service";
import {
  formatDate,
  formatProcessingDuration,
  formatElapsedProcessingTime,
} from "@/lib/utils/date-utils";
import { Film } from "lucide-react";
import { useEffect, useState } from "react";

interface VideosTableProps {
  videos: Video[];
}

function ProcessingTimeDisplay({
  startTimestamp,
  endTimestamp,
}: {
  startTimestamp?: string;
  endTimestamp?: string;
}) {
  const [elapsedTime, setElapsedTime] = useState<string>("—");

  useEffect(() => {
    if (!startTimestamp) {
      setElapsedTime("—");
      return;
    }

    if (endTimestamp) {
      // Processing finished - show final duration
      setElapsedTime(
        formatProcessingDuration(startTimestamp, endTimestamp)
      );
      return;
    }

    // Processing ongoing - update elapsed time periodically
    const updateElapsedTime = () => {
      setElapsedTime(formatElapsedProcessingTime(startTimestamp));
    };

    // Update immediately
    updateElapsedTime();

    // Update every second
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp, endTimestamp]);

  if (!startTimestamp) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (endTimestamp) {
    // Processing finished
    return <span>{elapsedTime}</span>;
  }

  // Processing ongoing
  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {elapsedTime}
    </span>
  );
}

export function VideosTable({ videos }: VideosTableProps) {
  const getStatusVariant = (
    status: Video["status"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
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
                  <Badge variant={getStatusVariant(video.status)}>
                    {video.status}
                  </Badge>
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
                  {formatVideoTime(video.video_time)}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-foreground sm:px-6">
                  {formatFileSize(video.file_size)}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  {formatDate(video.upload_start_timestamp)}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  <ProcessingTimeDisplay
                    startTimestamp={video.processing_start_timestamp}
                    endTimestamp={video.processing_end_timestamp}
                  />
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
                <Badge variant={getStatusVariant(video.status)} className="ml-2 shrink-0">
                  {video.status}
                </Badge>
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
                    {formatVideoTime(video.video_time)}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    File Size
                  </p>
                  <p className="text-sm text-foreground">
                    {formatFileSize(video.file_size)}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Upload Started
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(video.upload_start_timestamp)}
                </p>
              </div>
              {video.processing_start_timestamp && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Processing
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <ProcessingTimeDisplay
                      startTimestamp={video.processing_start_timestamp}
                      endTimestamp={video.processing_end_timestamp}
                    />
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

