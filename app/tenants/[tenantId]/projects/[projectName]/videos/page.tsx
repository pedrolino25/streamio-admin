"use client";

import { ProjectMetricsCards } from "@/components/cards/project-metrics-cards";
import { UploadTestDialog } from "@/components/dialogs/upload-test-dialog";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ProjectLayout } from "@/components/layout/project-layout";
import { VideosTable } from "@/components/tables/videos-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProject } from "@/lib/hooks/use-project";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { useVideos } from "@/lib/hooks/use-videos";
import { decodeProjectName } from "@/lib/utils/project-url";
import { Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ProjectVideosPage() {
  const params = useParams();
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
  } = useProject(projectName, apiKey);

  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useVideos(projectName, apiKey);

  const [uploadTestDialogOpen, setUploadTestDialogOpen] = useState(false);

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

  const loading = projectLoading || videosLoading;
  const error = projectError || videosError;

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
                } else if (videosError) {
                  refetchVideos();
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
          <ProjectMetricsCards videos={videos} />

          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <div>
                <CardTitle className="text-base font-semibold">Videos</CardTitle>
                <CardDescription className="mt-0.5">
                  {videos.length} {videos.length === 1 ? "video" : "videos"} total
                </CardDescription>
              </div>
              <CardAction>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setUploadTestDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </CardAction>
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
                    onClick={() => refetchVideos()}
                    aria-label="Retry fetching videos"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="p-3">
                  <VideosTable
                    videos={videos}
                    apiKey={apiKey}
                    projectName={projectName}
                    onRefresh={refetchVideos}
                    refreshing={videosLoading}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <UploadTestDialog
            open={uploadTestDialogOpen}
            onOpenChange={setUploadTestDialogOpen}
            apiKey={apiKey}
            projectName={projectName}
            onSuccess={refetchVideos}
          />
        </div>
      </ProjectLayout>
    </ProtectedRoute>
  );
}

