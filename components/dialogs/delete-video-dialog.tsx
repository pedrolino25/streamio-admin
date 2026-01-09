"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import { useToast } from "@/components/ui/toast-container";
import { useDeleteVideoMutation } from "@/lib/store/api";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteVideoDialogProps {
  videoId: string;
  videoPath?: string;
  videoStatus?: string;
  onSuccess: () => void;
  apiKey: string;
}

export function DeleteVideoDialog({
  videoId,
  videoPath,
  videoStatus,
  onSuccess,
  apiKey,
}: DeleteVideoDialogProps) {
  const [deleteVideo, { isLoading: loading, error: mutationError }] =
    useDeleteVideoMutation();
  const { success, error: showErrorToast } = useToast();
  const [open, setOpen] = useState(false);

  const statusUpper = videoStatus?.toUpperCase() || "";
  const isProcessed = statusUpper === "PROCESSED";
  const isProcessing = statusUpper === "PROCESSING" || statusUpper === "UPLOADING";
  const canDelete = isProcessed && !isProcessing;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleError = (error: unknown) => {
    const errorData = error as { data?: { code?: ErrorCode; message?: string } };
    const errorCode = errorData?.data?.code;
    const errorMessage =
      errorData?.data?.message || "Failed to delete video";

    if (errorCode === ErrorCode.UNAUTHORIZED) {
      showErrorToast("Invalid API key. Please check your tenant API key.");
    } else if (errorCode === ErrorCode.NOT_FOUND) {
      showErrorToast("Video not found. It may have already been deleted.");
    } else if (errorCode === ErrorCode.FORBIDDEN) {
      showErrorToast("You don't have permission to delete this video.");
    } else {
      showErrorToast(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVideo({ videoId, apiKey }).unwrap();
      setOpen(false);
      success("Video deleted successfully!");
      onSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const displayError =
    mutationError && "data" in mutationError
      ? (mutationError.data as { message?: string })?.message || null
      : null;
  const dialogAriaLabel = `Delete video ${videoId}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`hover:bg-muted ${!canDelete ? "opacity-50" : ""}`}
          disabled={isProcessing}
          aria-label={
            isProcessing
              ? `${dialogAriaLabel} (cannot delete: video is processing)`
              : !canDelete
              ? `${dialogAriaLabel} (cannot delete: video not processed)`
              : dialogAriaLabel
          }
          title={
            isProcessing
              ? "Cannot delete: video is currently processing"
              : !canDelete
              ? "Cannot delete: video must be processed first"
              : "Delete video"
          }
        >
          <Trash2
            className={`h-4 w-4 ${!canDelete ? "text-muted-foreground" : "text-destructive"}`}
            aria-hidden="true"
          />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md"
        aria-describedby="delete-video-description"
      >
        <DialogHeader>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogDescription id="delete-video-description">
            {isProcessing
              ? "This video cannot be deleted because it is currently being processed. Please wait until processing is complete."
              : canDelete
              ? "Are you sure you want to delete this video? This action cannot be undone and will permanently remove the video and all associated data."
              : "This video cannot be deleted because it has not been processed yet. Only processed videos can be deleted."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="mb-1 text-sm font-medium">Video ID:</p>
            <code className="block rounded bg-muted px-2 py-1 font-mono text-xs">
              {videoId}
            </code>
          </div>
          {videoPath && (
            <div>
              <p className="mb-1 text-sm font-medium">Path:</p>
              <code className="block max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                {videoPath}
              </code>
            </div>
          )}
          {videoStatus && (
            <div>
              <p className="mb-1 text-sm font-medium">Status:</p>
              <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium">
                {videoStatus}
              </span>
            </div>
          )}
        </div>
        {displayError && <ErrorMessage message={displayError} role="alert" />}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !canDelete}
            aria-label={
              !canDelete
                ? "Cannot delete: video not processed"
                : loading
                ? "Deleting video..."
                : "Confirm deletion"
            }
          >
            {loading ? "Deleting..." : "Delete Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

