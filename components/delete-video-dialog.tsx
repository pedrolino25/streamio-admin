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
  onSuccess: () => void;
  apiKey: string;
}

export function DeleteVideoDialog({
  videoId,
  videoPath,
  onSuccess,
  apiKey,
}: DeleteVideoDialogProps) {
  const [deleteVideo, { isLoading: loading, error: mutationError }] =
    useDeleteVideoMutation();
  const { success, error: showErrorToast } = useToast();
  const [open, setOpen] = useState(false);

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
          className="hover:bg-muted"
          aria-label={dialogAriaLabel}
        >
          <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md"
        aria-describedby="delete-video-description"
      >
        <DialogHeader>
          <DialogTitle>Delete Video</DialogTitle>
          <DialogDescription id="delete-video-description">
            Are you sure you want to delete this video? This action cannot be
            undone and will permanently remove the video and all associated data.
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
            disabled={loading}
            aria-label={loading ? "Deleting video..." : "Confirm deletion"}
          >
            {loading ? "Deleting..." : "Delete Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

