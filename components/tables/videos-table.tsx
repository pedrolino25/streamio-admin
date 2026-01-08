"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Video } from "@/lib/store/api";
import { formatDate } from "@/lib/utils/date-utils";
import {
  formatConfiguration,
  formatFileSize,
  formatVideoTime,
  getVideoStatusVariant,
} from "@/lib/utils/video-formatters";
import { ColumnDef } from "@tanstack/react-table";
import { Film, Pencil, Play, RefreshCw } from "lucide-react";
import * as React from "react";
import { DeleteVideoDialog } from "@/components/dialogs/delete-video-dialog";
import { EditVideoDialog } from "@/components/dialogs/edit-video-dialog";
import { VideoPlaybackTestDialog } from "@/components/dialogs/video-playback-test-dialog";
import { ProcessingTimeCell } from "./cells/processing-time-cell";

interface VideosTableProps {
  videos: Video[];
  apiKey: string;
  projectName: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}


export function VideosTable({
  videos,
  apiKey,
  projectName,
  onRefresh,
  refreshing = false,
}: VideosTableProps) {
  const [testPlaybackOpen, setTestPlaybackOpen] = React.useState(false);
  const [selectedVideoPath, setSelectedVideoPath] = React.useState<
    string | null
  >(null);
  const [editVideoOpen, setEditVideoOpen] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<Video | null>(null);

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
        meta: {
          defaultHidden: true,
        },
      },
      {
        accessorKey: "videoTitle",
        header: "Title",
        cell: ({ row }) => {
          const video = row.original;
          const videoTitle = row.getValue("videoTitle") as string | undefined;
          return (
            <div className="flex items-center justify-between gap-2">
              {videoTitle ? (
                <span className="text-sm text-foreground font-medium">
                  {videoTitle}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 ml-auto"
                onClick={() => {
                  setSelectedVideo(video);
                  setEditVideoOpen(true);
                }}
                title="Edit video title"
                aria-label={`Edit title for video ${video.id}`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          );
        },
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
                <Badge variant={getVideoStatusVariant(status)}>{status}</Badge>
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
        meta: {
          defaultHidden: true,
        },
      },
      {
        accessorKey: "processingStartTimestamp",
        header: "Processing",
        cell: ({ row }) => {
          const video = row.original;
          return (
            <ProcessingTimeCell
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
        meta: {
          defaultHidden: true,
        },
      },
      {
        id: "actions",
        header: "Actions",
        meta: {
          align: "right",
        },
        cell: ({ row }) => {
          const video = row.original;
          return (
            <div className="text-right">
              <DeleteVideoDialog
                videoId={video.id}
                videoPath={video.path}
                videoStatus={video.status}
                apiKey={apiKey}
                onSuccess={() => {
                  if (onRefresh) {
                    onRefresh();
                  }
                }}
              />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [apiKey, onRefresh]
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
        enableColumnVisibility
        enablePagination
        enableSorting
        pageSize={10}
        emptyState={
          <div className="py-12 text-center text-muted-foreground">
            No videos found matching your search.
          </div>
        }
        headerActions={
          <Button
            variant="outline"
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
        }
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
      {selectedVideo && (
        <EditVideoDialog
          videoId={selectedVideo.id}
          currentTitle={selectedVideo.videoTitle}
          apiKey={apiKey}
          open={editVideoOpen}
          onOpenChange={(open) => {
            setEditVideoOpen(open);
            if (!open) {
              setSelectedVideo(null);
            }
          }}
          onSuccess={() => {
            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}
    </>
  );
}
