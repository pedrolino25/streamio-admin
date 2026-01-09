"use client";

import { ProjectLayout } from "@/components/layout/project-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ProjectsTable } from "@/components/tables/projects-table";
import { Badge } from "@/components/ui/badge";
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
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { Check, Copy, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function TenantInfoPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;

  const {
    tenants,
    loading: tenantsLoading,
    error: tenantsError,
  } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.apiKey || "";

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects(apiKey);

  const { copyToClipboard, copiedId } = useClipboard();

  const handleCreateProject = () => {
    router.push(`/tenants/${tenantId}/projects/new`);
  };

  if (!tenantId) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <ErrorMessage message="Tenant ID is required" />
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

  const loading = tenantsLoading || projectsLoading;
  const error = tenantsError || projectsError;

  if (loading && !tenant) {
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
                if (tenantsError) {
                  window.location.reload();
                } else {
                  refetchProjects();
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

  if (!tenant) {
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
                    Account Information
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    API key and organization details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-card p-3 sm:p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Organization
                    </label>
                    <p className="text-sm font-semibold text-foreground">
                      {tenant.organization}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      API Key
                    </label>
                    <code className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground">
                      <span className="break-all">{tenant.apiKey}</span>
                      {tenant.apiKey && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 shrink-0"
                          aria-label="Copy API key"
                          onClick={() => copyToClipboard(tenant.apiKey)}
                        >
                          {copiedId === tenant.apiKey ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </code>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Status
                    </label>
                    {tenant.status && (
                      <Badge
                        variant={
                          tenant.status.toLowerCase() === "active"
                            ? "outline"
                            : "destructive"
                        }
                        className={
                          tenant.status.toLowerCase() === "active"
                            ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                            : ""
                        }
                      >
                        {tenant.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Projects
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {projects.length}{" "}
                    {projects.length === 1 ? "project" : "projects"} total
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleCreateProject} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-card p-0">
              {projectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : projectsError ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <ErrorMessage message={projectsError} className="mb-4" />
                  <Button
                    variant="outline"
                    onClick={() => refetchProjects()}
                    aria-label="Retry fetching projects"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="p-3">
                  <ProjectsTable
                    projects={projects}
                    onDelete={refetchProjects}
                    apiKey={apiKey}
                    tenantId={tenantId}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProjectLayout>
    </ProtectedRoute>
  );
}
