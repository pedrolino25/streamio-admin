"use client";

import { ProjectMetricsCards } from "@/components/cards/project-metrics-cards";
import { UploadTestDialog } from "@/components/dialogs/upload-test-dialog";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ProjectLayout } from "@/components/layout/project-layout";
import { ContentTable } from "@/components/tables/content-table";
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
import { useContent } from "@/lib/hooks/use-content";
import { decodeProjectName } from "@/lib/utils/project-url";
import { Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ProjectContentPage() {
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
    content,
    loading: contentLoading,
    error: contentError,
    refetch: refetchContent,
  } = useContent(projectName, apiKey);

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

  const loading = projectLoading || contentLoading;
  const error = projectError || contentError;

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
                } else if (contentError) {
                  refetchContent();
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

  const videoCount = content.filter((c) => c.contentType === "video").length;
  const imageCount = content.filter((c) => c.contentType === "image").length;

  return (
    <ProtectedRoute>
      <ProjectLayout>
        <div className="space-y-6">
          <ProjectMetricsCards content={content} />

          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <div>
                <CardTitle className="text-base font-semibold">Content</CardTitle>
                <CardDescription className="mt-0.5">
                  {content.length} {content.length === 1 ? "item" : "items"} total
                  {videoCount > 0 || imageCount > 0 ? (
                    <span className="ml-1">
                      ({videoCount} {videoCount === 1 ? "video" : "videos"}
                      {imageCount > 0 && `, ${imageCount} ${imageCount === 1 ? "image" : "images"}`})
                    </span>
                  ) : null}
                </CardDescription>
              </div>
              <CardAction>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setUploadTestDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Content
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="bg-card p-0">
              {contentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : contentError ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <ErrorMessage message={contentError} className="mb-4" />
                  <Button
                    variant="outline"
                    onClick={() => refetchContent()}
                    aria-label="Retry fetching content"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="p-3">
                  <ContentTable
                    content={content}
                    apiKey={apiKey}
                    projectName={projectName}
                    onRefresh={refetchContent}
                    refreshing={contentLoading}
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
            onSuccess={refetchContent}
          />
        </div>
      </ProjectLayout>
    </ProtectedRoute>
  );
}


