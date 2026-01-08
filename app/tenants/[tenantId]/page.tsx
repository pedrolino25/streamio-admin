"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { encodeProjectName } from "@/lib/utils/project-url";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch,
  } = useProjects(apiKey);

  useEffect(() => {
    if (!tenantsLoading && !projectsLoading && tenant && projects.length > 0) {
      const firstProject = projects[0];
      router.replace(
        `/tenants/${tenantId}/projects/${encodeProjectName(
          firstProject.projectName
        )}`
      );
    } else if (
      !tenantsLoading &&
      !projectsLoading &&
      tenant &&
      projects.length === 0
    ) {
      // If tenant has no projects, stay on tenant page and show message
      // But for now, we'll redirect to show empty state or create project
    }
  }, [tenantsLoading, projectsLoading, tenant, projects, tenantId, router]);

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

  if (loading || (tenant && projects.length > 0)) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
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
        </div>
      </ProtectedRoute>
    );
  }

  // If tenant has no projects, show empty state
  if (tenant && projects.length === 0) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <ErrorMessage message="No projects found for this tenant" />
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

  return null;
}
