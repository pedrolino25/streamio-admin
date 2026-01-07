"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Video } from "@/lib/store/api";
import {
  formatDate,
  formatElapsedProcessingTime,
  formatProcessingDuration,
} from "@/lib/utils/date-utils";
import { ColumnDef } from "@tanstack/react-table";
import { Film, Play, RefreshCw, Upload } from "lucide-react";
import * as React from "react";
import { UploadTestDialog } from "./upload-test-dialog";
import { VideoPlaybackTestDialog } from "./video-playback-test-dialog";

interface VideosTableProps {
  videos: Video[];
  apiKey: string;
  projectName: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function ProcessingTimeDisplay({
  startTimestamp,
  endTimestamp,
}: {
  startTimestamp?: string | number | null;
  endTimestamp?: string | number | null;
}) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!startTimestamp || endTimestamp) {
      return;
    }
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimestamp, endTimestamp]);

  if (!startTimestamp) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (endTimestamp) {
    return (
      <span>{formatProcessingDuration(startTimestamp, endTimestamp)}</span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {formatElapsedProcessingTime(startTimestamp)}
    </span>
  );
}

function formatFileSize(sizeMB?: number): string {
  if (!sizeMB) return "—";
  if (sizeMB < 1) {
    return `${(sizeMB * 1024).toFixed(2)} KB`;
  }
  return `${sizeMB.toFixed(2)} MB`;
}

function formatVideoTime(seconds?: number): string {
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
    parts.push(`${secs} sec`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 sec";
}

function formatConfiguration(config?: Video["configuration"]): string {
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
}

function getStatusVariant(
  status: Video["status"]
): "default" | "secondary" | "destructive" | "outline" {
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
}

export function VideosTable({
  videos,
  apiKey,
  projectName,
  onRefresh,
  refreshing = false,
}: VideosTableProps) {
  const [testPlaybackOpen, setTestPlaybackOpen] = React.useState(false);
  const [testUploadOpen, setTestUploadOpen] = React.useState(false);
  const [selectedVideoPath, setSelectedVideoPath] = React.useState<
    string | null
  >(null);

  const handlePlayVideo = (videoPath: string) => {
    setSelectedVideoPath(videoPath);
    setTestPlaybackOpen(true);
  };

  const columns: ColumnDef<Video>[] = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Video ID",
        cell: ({ row }) => (
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
            {row.getValue("id")}
          </code>
        ),
        enableHiding: true,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const video = row.original;
          return (
            <div className="flex justify-center">
              {status.toUpperCase() === "PROCESSED" && video.path ? (
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
                <Badge variant={getStatusVariant(status)}>{status}</Badge>
              )}
            </div>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "path",
        header: "Path",
        cell: ({ row }) => {
          const path = row.getValue("path") as string;
          return path ? (
            <code className="max-w-xs truncate rounded bg-muted px-2 py-1 font-mono text-xs text-foreground sm:max-w-md">
              {path}
            </code>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "videoTime",
        header: "Duration",
        cell: ({ row }) => {
          const videoTime = row.getValue("videoTime") as number | undefined;
          return (
            <span className="text-sm text-foreground">
              {formatVideoTime(videoTime)}
            </span>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "fileSize",
        header: "File Size",
        cell: ({ row }) => {
          const fileSize = row.getValue("fileSize") as number | undefined;
          return (
            <span className="text-sm text-foreground">
              {formatFileSize(fileSize)}
            </span>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "uploadStartTimestamp",
        header: "Upload Started",
        cell: ({ row }) => {
          const timestamp = row.getValue("uploadStartTimestamp") as
            | string
            | undefined;
          return (
            <span className="text-sm text-muted-foreground">
              {formatDate(timestamp)}
            </span>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "processingStartTimestamp",
        header: "Processing",
        cell: ({ row }) => {
          const video = row.original;
          return (
            <ProcessingTimeDisplay
              startTimestamp={video.processingStartTimestamp}
              endTimestamp={video.processingEndTimestamp}
            />
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "configuration",
        header: "Configuration",
        cell: ({ row }) => {
          const config = row.getValue("configuration") as
            | Video["configuration"]
            | undefined;
          return (
            <span className="max-w-xs truncate block text-sm text-muted-foreground">
              {formatConfiguration(config)}
            </span>
          );
        },
        enableHiding: true,
      },
    ],
    []
  );

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
    <>
      <DataTable
        columns={columns}
        data={videos}
        searchPlaceholder="Search videos..."
        enableColumnVisibility={true}
        enablePagination={true}
        enableSorting={true}
        pageSize={10}
        emptyState={
          <div className="py-12 text-center text-muted-foreground">
            No videos found matching your search.
          </div>
        }
        headerActions={
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (onRefresh) {
                  onRefresh();
                }
              }}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Test
            </Button>
          </>
        }
      />
      <UploadTestDialog
        open={testUploadOpen}
        onOpenChange={setTestUploadOpen}
        apiKey={apiKey}
        projectName={projectName}
      />
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
    </>
  );
}
