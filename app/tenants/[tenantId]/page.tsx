"use client";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ProjectsTable } from "@/components/projects-table";
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
import { useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;

  const {
    tenants,
    loading: tenantsLoading,
    error: tenantsError,
  } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.api_key || "";
  console.log("apiKey", apiKey);
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch,
  } = useProjects(apiKey);

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader
          title={tenant?.organization || "Tenant"}
          description={
            tenant ? `Manage projects for ${tenant.organization}` : undefined
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
                <span className="hidden sm:inline">Back to Tenants</span>
              </Button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {loading && !tenant ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="px-4 py-12 text-center sm:px-6">
              <ErrorMessage message={error} className="mb-4" />
              <Button
                variant="outline"
                onClick={() => {
                  if (tenantsError) {
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
          ) : tenant ? (
            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-card px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        Tenant Information
                      </CardTitle>
                      <CardDescription className="mt-1">
                        API key and organization details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-card p-4 sm:p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Organization
                        </label>
                        <p className="text-sm font-medium text-foreground">
                          {tenant.organization}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          API Key
                        </label>
                        <code className="block break-all rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
                          {tenant.api_key}
                        </code>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Status
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {tenant.status}
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
                        Projects
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {projects.length}{" "}
                        {projects.length === 1 ? "project" : "projects"} total
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <CreateProjectDialog
                        onSuccess={refetch}
                        apiKey={apiKey}
                      />
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
                        onClick={() => refetch()}
                        aria-label="Retry fetching projects"
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <ProjectsTable
                      projects={projects}
                      onDelete={refetch}
                      apiKey={apiKey}
                      tenantId={tenantId}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
