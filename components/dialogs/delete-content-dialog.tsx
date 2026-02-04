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
import { useDeleteContentMutation } from "@/lib/store/api";
import { ErrorCode } from "@/lib/types/errors";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteContentDialogProps {
  contentId: string;
  contentPath?: string;
  contentType: "video" | "image";
  contentStatus?: string;
  onSuccess: () => void;
  apiKey: string;
}

export function DeleteContentDialog({
  contentId,
  contentPath,
  contentType,
  contentStatus,
  onSuccess,
  apiKey,
}: DeleteContentDialogProps) {
  const [deleteContent, { isLoading: loading, error: mutationError }] =
    useDeleteContentMutation();
  const { success, error: showErrorToast } = useToast();
  const [open, setOpen] = useState(false);

  const statusUpper = contentStatus?.toUpperCase() || "";
  const isProcessing =
    statusUpper === "PROCESSING" || statusUpper === "UPLOADING";
  const canDelete = !isProcessing;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleError = (error: unknown) => {
    const errorData = error as {
      data?: { code?: ErrorCode; message?: string };
    };
    const errorCode = errorData?.data?.code;
    const errorMessage = errorData?.data?.message || "Failed to delete content";

    if (errorCode === ErrorCode.UNAUTHORIZED) {
      showErrorToast("Invalid API key. Please check your tenant API key.");
    } else if (errorCode === ErrorCode.NOT_FOUND) {
      showErrorToast("Content not found. It may have already been deleted.");
    } else if (errorCode === ErrorCode.FORBIDDEN) {
      showErrorToast("You don't have permission to delete this content.");
    } else {
      showErrorToast(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContent({ contentId, apiKey }).unwrap();
      setOpen(false);
      success(`${contentType === "video" ? "Video" : "Image"} deleted successfully!`);
      onSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const displayError =
    mutationError && "data" in mutationError
      ? (mutationError.data as { message?: string })?.message || null
      : null;
  const dialogAriaLabel = `Delete ${contentType} ${contentId}`;
  const contentTypeLabel = contentType === "video" ? "Video" : "Image";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`hover:bg-muted ${!canDelete ? "opacity-50" : ""}`}
          disabled={!canDelete}
          aria-label={
            !canDelete
              ? `${dialogAriaLabel} (cannot delete: ${contentType} is processing)`
              : dialogAriaLabel
          }
          title={
            !canDelete
              ? `Cannot delete: ${contentType} is currently processing`
              : `Delete ${contentType}`
          }
        >
          <Trash2
            className={`h-4 w-4 ${
              !canDelete ? "text-muted-foreground" : "text-destructive"
            }`}
            aria-hidden="true"
          />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md"
        aria-describedby="delete-content-description"
      >
        <DialogHeader>
          <DialogTitle>Delete {contentTypeLabel}</DialogTitle>
          <DialogDescription id="delete-content-description">
            {!canDelete
              ? `This ${contentType} cannot be deleted because it is currently being processed. Please wait until processing is complete.`
              : `Are you sure you want to delete this ${contentType}? This action cannot be undone and will permanently remove the ${contentType} and all associated data.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="mb-1 text-sm font-medium">Content ID:</p>
            <code className="block rounded bg-muted px-2 py-1 font-mono text-xs">
              {contentId}
            </code>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Type:</p>
            <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium capitalize">
              {contentType}
            </span>
          </div>
          {contentPath && (
            <div>
              <p className="mb-1 text-sm font-medium">Path:</p>
              <code className="block max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                {contentPath}
              </code>
            </div>
          )}
          {contentStatus && (
            <div>
              <p className="mb-1 text-sm font-medium">Status:</p>
              <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium">
                {contentStatus}
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
                ? `Cannot delete: ${contentType} not processed`
                : loading
                ? `Deleting ${contentType}...`
                : "Confirm deletion"
            }
          >
            {loading ? "Deleting..." : `Delete ${contentTypeLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
