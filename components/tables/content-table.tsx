"use client";

import { DeleteContentDialog } from "@/components/dialogs/delete-content-dialog";
import { EditContentDialog } from "@/components/dialogs/edit-content-dialog";
import { VideoPlaybackTestDialog } from "@/components/dialogs/video-playback-test-dialog";
import { ImageViewerDialog } from "@/components/dialogs/image-viewer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Content } from "@/lib/store/api";
import { formatDate } from "@/lib/utils/date-utils";
import {
  formatConfiguration,
  formatFileSize,
  formatVideoTime,
  getContentStatusVariant,
} from "@/lib/utils/content-formatters";
import { ColumnDef } from "@tanstack/react-table";
import { Film, Image, Pencil, Play, RefreshCw, Eye } from "lucide-react";
import * as React from "react";
import { ProcessingTimeCell } from "./cells/processing-time-cell";

interface ContentTableProps {
  content: Content[];
  apiKey: string;
  projectName: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ContentTable({
  content,
  apiKey,
  projectName,
  onRefresh,
  refreshing = false,
}: ContentTableProps) {
  const [testPlaybackOpen, setTestPlaybackOpen] = React.useState(false);
  const [selectedVideoPath, setSelectedVideoPath] = React.useState<
    string | null
  >(null);
  const [imageViewerOpen, setImageViewerOpen] = React.useState(false);
  const [selectedImagePath, setSelectedImagePath] = React.useState<
    string | null
  >(null);
  const [editContentOpen, setEditContentOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<Content | null>(null);

  const handlePlayVideo = (videoPath: string) => {
    setSelectedVideoPath(videoPath);
    setTestPlaybackOpen(true);
  };

  const handleViewImage = (imagePath: string) => {
    setSelectedImagePath(imagePath);
    setImageViewerOpen(true);
  };

  const columns: ColumnDef<Content>[] = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Content ID",
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
        accessorKey: "contentType",
        header: "Type",
        cell: ({ row }) => {
          const contentType = row.getValue("contentType") as "video" | "image";
          return (
            <Badge variant="outline" className="capitalize">
              {contentType === "video" ? (
                <Film className="mr-1 h-3 w-3" />
              ) : (
                <Image className="mr-1 h-3 w-3" />
              )}
              {contentType}
            </Badge>
          );
        },
        enableHiding: true,
      },
      {
        accessorKey: "contentTitle",
        header: "Title",
        cell: ({ row }) => {
          const contentItem = row.original;
          const contentTitle = row.getValue("contentTitle") as string | undefined;
          return (
            <div className="flex items-center justify-between gap-2">
              {contentTitle ? (
                <span className="text-sm text-foreground font-medium">
                  {contentTitle}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 ml-auto"
                onClick={() => {
                  setSelectedContent(contentItem);
                  setEditContentOpen(true);
                }}
                title="Edit content title"
                aria-label={`Edit title for content ${contentItem.id}`}
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
          const contentItem = row.original;
          const isVideo = contentItem.contentType === "video";
          const isImage = contentItem.contentType === "image";
          const isProcessed = status.toUpperCase() === "PROCESSED";
          
          return (
            <div className="flex justify-center">
              {isProcessed && contentItem.path ? (
                isVideo ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                    onClick={() => handlePlayVideo(contentItem.path)}
                    title="Play video"
                    aria-label={`Play video ${contentItem.path}`}
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Play video
                  </Button>
                ) : isImage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                    onClick={() => handleViewImage(contentItem.path)}
                    title="View image"
                    aria-label={`View image ${contentItem.path}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View image
                  </Button>
                ) : (
                  <Badge variant={getContentStatusVariant(status)}>{status}</Badge>
                )
              ) : (
                <Badge variant={getContentStatusVariant(status)}>{status}</Badge>
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
          const contentItem = row.original;
          const videoTime = row.getValue("videoTime") as number | undefined;
          // Only show duration for videos
          if (contentItem.contentType !== "video") {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
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
          const contentItem = row.original;
          return (
            <ProcessingTimeCell
              startTimestamp={contentItem.processingStartTimestamp}
              endTimestamp={contentItem.processingEndTimestamp}
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
            | Content["configuration"]
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
          const contentItem = row.original;
          return (
            <div className="text-right">
              <DeleteContentDialog
                contentId={contentItem.id}
                contentPath={contentItem.path}
                contentType={contentItem.contentType}
                contentStatus={contentItem.status}
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

  if (content.length === 0) {
    return (
      <EmptyState
        icon={<Film className="h-6 w-6 text-muted-foreground" />}
        title="No content found"
        description="Content uploaded for this project will appear here."
      />
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={content}
        searchPlaceholder="Search content..."
        enableColumnVisibility
        enablePagination
        enableSorting
        pageSize={10}
        emptyState={
          <div className="py-12 text-center text-muted-foreground">
            No content found matching your search.
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
      {selectedVideoPath && (
        <VideoPlaybackTestDialog
          open={testPlaybackOpen}
          onOpenChange={(open) => {
            setTestPlaybackOpen(open);
            if (!open) {
              setSelectedVideoPath(null);
            }
          }}
          apiKey={apiKey}
          videoPath={selectedVideoPath}
          projectName={projectName}
        />
      )}
      {selectedImagePath && (
        <ImageViewerDialog
          open={imageViewerOpen}
          onOpenChange={(open) => {
            setImageViewerOpen(open);
            if (!open) {
              setSelectedImagePath(null);
            }
          }}
          apiKey={apiKey}
          imagePath={selectedImagePath}
          projectName={projectName}
        />
      )}
      {selectedContent && (
        <EditContentDialog
          contentId={selectedContent.id}
          contentType={selectedContent.contentType}
          currentTitle={selectedContent.contentTitle}
          apiKey={apiKey}
          open={editContentOpen}
          onOpenChange={(open) => {
            setEditContentOpen(open);
            if (!open) {
              setSelectedContent(null);
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
