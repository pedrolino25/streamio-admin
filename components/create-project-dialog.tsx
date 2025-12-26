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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-container";
import { useProjectMutations } from "@/lib/hooks/use-project-mutations";
import {
  projectFormSchema,
  ProjectFormValues,
} from "@/lib/schemas/project-schemas";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateProjectDialogProps {
  onSuccess: () => void;
}

export function CreateProjectDialog({ onSuccess }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    createProject,
    loading,
    error: mutationError,
    clearError,
  } = useProjectMutations();
  const { success, error: showErrorToast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      project_name: "",
      webhook_url: "",
    },
  });

  const handleError = (error: unknown) => {
    const appError = error instanceof ApplicationError ? error : null;
    const errorMessage = appError?.message || "Failed to create project";

    if (appError?.code === ErrorCode.PROJECT_EXISTS) {
      showErrorToast("A project with this name already exists");
    } else if (appError?.code === ErrorCode.UNAUTHORIZED) {
      showErrorToast("Your session has expired. Please sign in again.");
    } else {
      showErrorToast(errorMessage);
    }
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    clearError();

    try {
      await createProject(values);
      setOpen(false);
      form.reset();
      success("Project created successfully!");
      onSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      clearError();
    }
  };

  const displayError = mutationError?.message || null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label="Create new project">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] sm:max-w-md"
        aria-describedby="create-project-description"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription id="create-project-description">
                Create a new project to generate an API key for accessing the
                Media Processing Platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="project_name">Project Name</FormLabel>
                    <FormControl>
                      <Input
                        id="project_name"
                        placeholder="my-project"
                        {...field}
                        disabled={loading}
                        aria-describedby="project-name-description project-name-error"
                        aria-invalid={!!form.formState.errors.project_name}
                      />
                    </FormControl>
                    <FormDescription id="project-name-description">
                      A user-friendly name for this project (letters, numbers,
                      and hyphens only, no spaces)
                    </FormDescription>
                    <FormMessage id="project-name-error" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="webhook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="webhook_url">Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        id="webhook_url"
                        type="url"
                        placeholder="https://your-api.com/webhooks/video-processed"
                        {...field}
                        disabled={loading}
                        aria-describedby="webhook-url-description webhook-url-error"
                        aria-invalid={!!form.formState.errors.webhook_url}
                      />
                    </FormControl>
                    <FormDescription id="webhook-url-description">
                      Webhook URL to receive notifications when videos are
                      processed
                    </FormDescription>
                    <FormMessage id="webhook-url-error" />
                  </FormItem>
                )}
              />
              {displayError && (
                <ErrorMessage message={displayError} role="alert" />
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                aria-label="Cancel project creation"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                aria-label={loading ? "Creating project..." : "Create project"}
              >
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
