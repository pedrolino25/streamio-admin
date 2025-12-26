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
import { useProjectMutations } from "@/lib/hooks/use-project-mutations";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName?: string;
  onSuccess: () => void;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  onSuccess,
}: DeleteProjectDialogProps) {
  const {
    deleteProject,
    loading,
    error: mutationError,
    clearError,
  } = useProjectMutations();
  const { success, error: showErrorToast } = useToast();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      clearError();
    }
  };

  const handleError = (error: unknown) => {
    const appError = error instanceof ApplicationError ? error : null;
    const errorMessage = appError?.message || "Failed to delete project";

    if (appError?.code === ErrorCode.UNAUTHORIZED) {
      showErrorToast("Your session has expired. Please sign in again.");
    } else if (appError?.code === ErrorCode.PROJECT_NOT_FOUND) {
      showErrorToast("Project not found. It may have already been deleted.");
    } else {
      showErrorToast(errorMessage);
    }
  };

  const handleDelete = async () => {
    clearError();

    try {
      await deleteProject(projectId);
      setOpen(false);
      success("Project deleted successfully!");
      onSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const displayError = mutationError?.message || null;
  const dialogAriaLabel = `Delete project ${projectName || projectId}`;

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
        aria-describedby="delete-project-description"
      >
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription id="delete-project-description">
            Are you sure you want to delete this project? This action cannot be
            undone and will revoke access for this API key.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {projectName && (
            <div>
              <p className="mb-1 text-sm font-medium">Project Name:</p>
              <p className="text-sm">{projectName}</p>
            </div>
          )}
          <div>
            <p className="mb-1 text-sm font-medium">API Key:</p>
            <div className="break-all rounded-md bg-muted p-3 font-mono text-sm">
              {projectId}
            </div>
          </div>
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
            aria-label={loading ? "Deleting project..." : "Confirm deletion"}
          >
            {loading ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
