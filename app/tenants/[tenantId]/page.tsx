"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-container";
import { useProjectMutations, useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import {
  projectFormSchema,
  ProjectFormValues,
} from "@/lib/schemas/project-schemas";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { encodeProjectName } from "@/lib/utils/project-url";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface CreateFirstProjectPageProps {
  tenantId: string;
  apiKey: string;
  tenantName: string;
}

function CreateFirstProjectPage({
  tenantId,
  apiKey,
  tenantName,
}: CreateFirstProjectPageProps) {
  const router = useRouter();
  const {
    createProject,
    loading,
    error: mutationError,
    clearError,
  } = useProjectMutations();
  const { success, error: showErrorToast } = useToast();
  const { refetch } = useProjects(apiKey);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: "",
      webhookUrl: "",
    },
  });

  const handleError = (error: unknown) => {
    const appError = error instanceof ApplicationError ? error : null;
    const errorMessage = appError?.message || "Failed to create project";

    if (appError?.code === ErrorCode.PROJECT_EXISTS) {
      showErrorToast("A project with this name already exists");
    } else if (appError?.code === ErrorCode.UNAUTHORIZED) {
      showErrorToast("Invalid API key. Please check your tenant API key.");
    } else {
      showErrorToast(errorMessage);
    }
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    clearError();

    try {
      await createProject(values, apiKey);
      form.reset();
      success("Project created successfully!");
      await refetch();
      router.push(
        `/tenants/${tenantId}/projects/${encodeProjectName(values.projectName)}`
      );
    } catch (error) {
      handleError(error);
    }
  };

  const displayError = mutationError?.message || null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader>
          <PageHeader.Start>
            <PageHeader.Text>
              <PageHeader.Title>Create Your First Project</PageHeader.Title>
              <PageHeader.Description>
                Get started by creating your first project for {tenantName}
              </PageHeader.Description>
            </PageHeader.Text>
          </PageHeader.Start>
        </PageHeader>

        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <CardTitle className="text-base font-semibold">
                Project Details
              </CardTitle>
              <CardDescription className="mt-0.5">
                Define the name and optional webhook URL for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-card p-3 sm:p-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="projectName">
                          Project Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="projectName"
                            placeholder="my-project"
                            {...field}
                            disabled={loading}
                            aria-describedby="project-name-description project-name-error"
                            aria-invalid={!!form.formState.errors.projectName}
                          />
                        </FormControl>
                        <FormDescription id="project-name-description">
                          A user-friendly name for this project (letters,
                          numbers, and hyphens only, no spaces)
                        </FormDescription>
                        <FormMessage id="project-name-error" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="webhookUrl">
                          Webhook URL (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="webhookUrl"
                            type="url"
                            placeholder="https://your-api.com/webhooks/video-processed"
                            {...field}
                            disabled={loading}
                            aria-describedby="webhook-url-description webhook-url-error"
                            aria-invalid={!!form.formState.errors.webhookUrl}
                          />
                        </FormControl>
                        <FormDescription id="webhook-url-description">
                          Optional webhook URL to receive notifications when
                          videos are processed
                        </FormDescription>
                        <FormMessage id="webhook-url-error" />
                      </FormItem>
                    )}
                  />
                  {displayError && (
                    <ErrorMessage message={displayError} role="alert" />
                  )}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      aria-label={
                        loading ? "Creating project..." : "Create project"
                      }
                    >
                      {loading ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

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
  const apiKey = tenant?.apiKey || "";
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

  if (tenant && projects.length === 0) {
    return (
      <CreateFirstProjectPage
        tenantId={tenantId}
        apiKey={apiKey}
        tenantName={tenant.organization}
      />
    );
  }

  return null;
}
