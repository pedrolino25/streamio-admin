"use client";

import { DeleteProjectDialog } from "@/components/dialogs/delete-project-dialog";
import { WebhookTestDialogControlled } from "@/components/dialogs/webhook-test-dialog-controlled";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ProjectLayout } from "@/components/layout/project-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { useProject } from "@/lib/hooks/use-project";
import { useProjectMutations, useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { formatDate } from "@/lib/utils/date-utils";
import { decodeProjectName, encodeProjectName } from "@/lib/utils/project-url";
import { useToast } from "@/components/ui/toast-container";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Pencil, Plus, Trash2, Webhook } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export default function ProjectInfoPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const projectName = params?.projectName
    ? decodeProjectName(params.projectName as string)
    : "";

  const { tenants } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.apiKey || "";

  const {
    project,
    loading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useProject(projectName, apiKey);

  const { projects } = useProjects(apiKey);
  const { copyToClipboard, copiedId } = useClipboard();
  const { success, error: showErrorToast } = useToast();
  const {
    updateProject,
    loading: updateLoading,
    error: updateError,
    clearError: clearUpdateError,
  } = useProjectMutations();

  const [testWebhookOpen, setTestWebhookOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);

  const webhookForm = useForm<{ webhookUrl?: string }>({
    resolver: zodResolver(
      z.object({
        webhookUrl: z
          .string()
          .url("Must be a valid URL")
          .optional()
          .or(z.literal("")),
      })
    ),
    defaultValues: {
      webhookUrl: "",
    },
  });

  const handleWebhookDialogOpen = (open: boolean) => {
    setWebhookDialogOpen(open);
    if (open && project) {
      webhookForm.reset({
        webhookUrl: project.webhookUrl || "",
      });
    } else {
      webhookForm.reset();
      clearUpdateError();
    }
  };

  const handleSaveWebhook = async (values: { webhookUrl?: string }) => {
    if (!project) return;

    clearUpdateError();
    try {
      await updateProject(
        {
          projectName: project.projectName,
          webhookUrl: values.webhookUrl?.trim() || undefined,
        },
        apiKey
      );
      setWebhookDialogOpen(false);
      webhookForm.reset();
      success("Webhook URL updated successfully!");
      refetchProject();
    } catch (error) {
      const appError = error instanceof ApplicationError ? error : null;
      const errorMessage = appError?.message || "Failed to update webhook URL";

      if (appError?.code === ErrorCode.UNAUTHORIZED) {
        showErrorToast("Invalid API key. Please check your tenant API key.");
      } else {
        showErrorToast(errorMessage);
      }
    }
  };

  const handleRemoveWebhook = async () => {
    if (!project) return;

    clearUpdateError();
    try {
      await updateProject(
        {
          projectName: project.projectName,
          webhookUrl: undefined,
        },
        apiKey
      );
      setWebhookDialogOpen(false);
      webhookForm.reset();
      success("Webhook URL removed successfully!");
      refetchProject();
    } catch (error) {
      const appError = error instanceof ApplicationError ? error : null;
      const errorMessage = appError?.message || "Failed to remove webhook URL";

      if (appError?.code === ErrorCode.UNAUTHORIZED) {
        showErrorToast("Invalid API key. Please check your tenant API key.");
      } else {
        showErrorToast(errorMessage);
      }
    }
  };

  const handleDeleteProject = () => {
    const remainingProjects = projects.filter(
      (p) => p.projectName !== projectName
    );
    const otherProject = remainingProjects[0];

    if (otherProject) {
      router.push(
        `/tenants/${tenantId}/projects/${encodeProjectName(
          otherProject.projectName
        )}/videos`
      );
    } else {
      router.push(`/tenants/${tenantId}/info`);
    }
  };

  if (!params?.tenantId || !params?.projectName) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <ErrorMessage message="Tenant ID and project name are required" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const loading = projectLoading;
  const error = projectError;

  if (loading && !project) {
    return (
      <ProtectedRoute>
        <ProjectLayout>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </ProjectLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <ProjectLayout>
          <div className="px-4 py-12 text-center sm:px-6">
            <ErrorMessage message={error} className="mb-4" />
            <Button
              variant="outline"
              onClick={() => {
                if (projectError) {
                  window.location.reload();
                }
              }}
              aria-label="Retry"
            >
              Try again
            </Button>
          </div>
        </ProjectLayout>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <ProtectedRoute>
      <ProjectLayout>
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Project Information
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Project details and settings
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {project.webhookUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestWebhookOpen(true)}
                    >
                      <Webhook className="mr-2 h-4 w-4" />
                      Webhook Test
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-card p-3 sm:p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Project Name
                    </label>
                    <p className="text-sm font-semibold text-foreground">
                      {project.projectName}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Project ID
                    </label>
                    <p className="text-xs font-medium text-foreground">
                      {project.id}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Webhook URL
                    </label>
                    {project.webhookUrl ? (
                      <div className="flex items-center gap-2">
                        <code className="inline-flex flex-1 items-center gap-1.5 break-all rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground">
                          <span className="flex-1">{project.webhookUrl}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 shrink-0 p-0 hover:bg-muted/80"
                            onClick={() => copyToClipboard(project.webhookUrl!)}
                            title="Copy webhook URL"
                            aria-label="Copy webhook URL"
                          >
                            {copiedId === project.webhookUrl ? (
                              <Check
                                className="h-3 w-3 text-primary"
                                aria-hidden="true"
                              />
                            ) : (
                              <Copy className="h-3 w-3" aria-hidden="true" />
                            )}
                          </Button>
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => handleWebhookDialogOpen(true)}
                          title="Edit webhook URL"
                          aria-label="Edit webhook URL"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleWebhookDialogOpen(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add webhook URL
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <DeleteProjectDialog
                  projectName={project.projectName}
                  onSuccess={handleDeleteProject}
                  apiKey={apiKey}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {project && project.webhookUrl && (
          <WebhookTestDialogControlled
            open={testWebhookOpen}
            onOpenChange={setTestWebhookOpen}
            webhookUrl={project.webhookUrl}
          />
        )}
        <Dialog open={webhookDialogOpen} onOpenChange={handleWebhookDialogOpen}>
          <DialogContent
            className="max-w-[95vw] sm:max-w-md"
            aria-describedby="webhook-url-description"
          >
            <Form {...webhookForm}>
              <form onSubmit={webhookForm.handleSubmit(handleSaveWebhook)}>
                <DialogHeader>
                  <DialogTitle>
                    {project?.webhookUrl
                      ? "Edit Webhook URL"
                      : "Add Webhook URL"}
                  </DialogTitle>
                  <DialogDescription id="webhook-url-description">
                    {project?.webhookUrl
                      ? "Update the webhook URL for this project."
                      : "Configure a webhook URL to receive notifications for this project."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={webhookForm.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="webhookUrl">Webhook URL</FormLabel>
                        <FormControl>
                          <Input
                            id="webhookUrl"
                            type="url"
                            placeholder="https://your-api.com/webhooks/video-processed"
                            {...field}
                            disabled={updateLoading}
                            aria-describedby="webhook-url-description webhook-url-error"
                            aria-invalid={
                              !!webhookForm.formState.errors.webhookUrl
                            }
                          />
                        </FormControl>
                        <FormDescription id="webhook-url-description">
                          Optional webhook URL to receive notifications when
                          videos are processed.
                        </FormDescription>
                        <FormMessage id="webhook-url-error" />
                      </FormItem>
                    )}
                  />
                  {updateError && (
                    <ErrorMessage
                      message={updateError.message}
                      className="text-sm"
                    />
                  )}
                </div>
                <DialogFooter>
                  {project?.webhookUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleRemoveWebhook}
                      disabled={updateLoading}
                      aria-label="Remove webhook URL"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleWebhookDialogOpen(false)}
                    disabled={updateLoading}
                    aria-label="Cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateLoading}
                    aria-label={
                      updateLoading
                        ? "Saving..."
                        : project?.webhookUrl
                        ? "Update webhook URL"
                        : "Add webhook URL"
                    }
                  >
                    {updateLoading
                      ? "Saving..."
                      : project?.webhookUrl
                      ? "Update"
                      : "Add"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </ProjectLayout>
    </ProtectedRoute>
  );
}

