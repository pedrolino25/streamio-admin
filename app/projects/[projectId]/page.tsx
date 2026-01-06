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
import { VideoPlaybackTestDialog } from "@/components/video-playback-test-dialog";
import { VideosTable } from "@/components/videos-table";
import { WebhookTestDialogControlled } from "@/components/webhook-test-dialog-controlled";
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { useProject } from "@/lib/hooks/use-project";
import { useVideos } from "@/lib/hooks/use-videos";
import { formatDate } from "@/lib/utils/date-utils";
import { ArrowLeft, Check, Copy, Play, Upload, Webhook } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const {
    project,
    loading: projectLoading,
    error: projectError,
  } = useProject(projectId);
  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch,
  } = useVideos(project?.project_name || "");
  const { copyToClipboard, copiedId } = useClipboard();
  const [testPlaybackOpen, setTestPlaybackOpen] = useState(false);
  const [testUploadOpen, setTestUploadOpen] = useState(false);
  const [testWebhookOpen, setTestWebhookOpen] = useState(false);

  const loading = projectLoading || videosLoading;
  const error = projectError || videosError;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader
          title={project?.project_name}
          description={
            project
              ? `Manage videos and settings for ${project.project_name}`
              : undefined
          }
          actions={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
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
              {/* Project Information Card */}
              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-card px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Project Information
                      </CardTitle>
                      <CardDescription className="mt-1">
                        API key, webhook URL, and project details
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestPlaybackOpen(true)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Test Playback
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestWebhookOpen(true)}
                      >
                        <Webhook className="mr-2 h-4 w-4" />
                        Webhook Test
                      </Button>
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
                          {project.project_name || (
                            <span className="italic text-muted-foreground">
                              Unnamed Project
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          API Key
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
                            {project.project_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 shrink-0 p-0 hover:bg-muted"
                            onClick={() => copyToClipboard(project.project_id)}
                            title="Copy API key"
                            aria-label={`Copy API key ${project.project_id}`}
                          >
                            {copiedId === project.project_id ? (
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
                        {project.webhook_url ? (
                          <code className="block break-all rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
                            {project.webhook_url}
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
                          {formatDate(project.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Videos Card */}
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
                    <VideosTable videos={videos} />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Test Dialogs */}
        {project && (
          <>
            <VideoPlaybackTestDialog
              open={testPlaybackOpen}
              onOpenChange={setTestPlaybackOpen}
              apiKey={project.project_id}
            />
            <UploadTestDialog
              open={testUploadOpen}
              onOpenChange={setTestUploadOpen}
              apiKey={project.project_id}
            />
            {project.webhook_url && (
              <WebhookTestDialogControlled
                open={testWebhookOpen}
                onOpenChange={setTestWebhookOpen}
                webhookUrl={project.webhook_url}
              />
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
