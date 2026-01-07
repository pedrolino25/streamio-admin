"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { UploadTestDialog } from "@/components/upload-test-dialog";
import { VideosTable } from "@/components/videos-table";
import { WebhookTestDialogControlled } from "@/components/webhook-test-dialog-controlled";
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { useProject } from "@/lib/hooks/use-project";
import { useTenants } from "@/lib/hooks/use-tenants";
import { useVideos } from "@/lib/hooks/use-videos";
import { formatDate } from "@/lib/utils/date-utils";
import { decodeProjectName } from "@/lib/utils/project-url";
import { ArrowLeft, Check, Copy, Upload, Webhook } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tenantId = params?.tenantId as string;
  const projectName = params?.projectName
    ? decodeProjectName(params.projectName as string)
    : "";

  const { tenants } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.api_key || "";

  const {
    project,
    loading: projectLoading,
    error: projectError,
  } = useProject(projectName, apiKey);
  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch,
  } = useVideos(projectName, apiKey);
  const { copyToClipboard, copiedId } = useClipboard();
  const [testUploadOpen, setTestUploadOpen] = useState(false);
  const [testWebhookOpen, setTestWebhookOpen] = useState(false);

  if (!params?.tenantId || !params?.projectName) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <ErrorMessage message="Tenant ID and project name are required" />
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Back to Tenants
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const loading = projectLoading || videosLoading;
  const error = projectError || videosError;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader
          title={project?.projectName}
          description={
            project
              ? `Manage videos and settings for ${project.projectName}`
              : undefined
          }
          actions={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tenants/${tenantId}`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Projects</span>
              </Button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {loading && !project ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="px-4 py-12 text-center sm:px-6">
              <ErrorMessage message={error} className="mb-4" />
              <Button
                variant="outline"
                onClick={() => {
                  if (projectError) {
                    window.location.reload();
                  } else {
                    refetch();
                  }
                }}
                aria-label="Retry"
              >
                Try again
              </Button>
            </div>
          ) : project ? (
            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-card px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Project Information
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Project details and settings
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestUploadOpen(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Test
                      </Button>
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
                <CardContent className="bg-card p-4 sm:p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Project Name
                        </label>
                        <p className="text-sm font-medium text-foreground">
                          {project.projectName}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Project ID
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
                            {project.id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 shrink-0 p-0 hover:bg-muted"
                            onClick={() => copyToClipboard(project.id)}
                            title="Copy project ID"
                            aria-label={`Copy project ID ${project.id}`}
                          >
                            {copiedId === project.id ? (
                              <Check
                                className="h-4 w-4 text-primary"
                                aria-hidden="true"
                              />
                            ) : (
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Webhook URL
                        </label>
                        {project.webhookUrl ? (
                          <code className="block break-all rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
                            {project.webhookUrl}
                          </code>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Created At
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-card px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Videos
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {videos.length}{" "}
                        {videos.length === 1 ? "video" : "videos"} total
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={videosLoading}
                    >
                      {videosLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Refreshing...
                        </>
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="bg-card p-0">
                  {videosLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : videosError ? (
                    <div className="px-4 py-12 text-center sm:px-6">
                      <ErrorMessage message={videosError} className="mb-4" />
                      <Button
                        variant="outline"
                        onClick={() => refetch()}
                        aria-label="Retry fetching videos"
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <VideosTable videos={videos} apiKey={apiKey} />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {project && (
          <>
            <UploadTestDialog
              open={testUploadOpen}
              onOpenChange={setTestUploadOpen}
              apiKey={apiKey}
              projectName={projectName}
            />
            {project.webhookUrl && (
              <WebhookTestDialogControlled
                open={testWebhookOpen}
                onOpenChange={setTestWebhookOpen}
                webhookUrl={project.webhookUrl}
              />
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
