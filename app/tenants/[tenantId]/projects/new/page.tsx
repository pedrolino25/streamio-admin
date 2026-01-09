"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { ProjectLayout } from "@/components/layout/project-layout";
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
import { useProjectMutations, useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import {
  projectFormSchema,
  ProjectFormValues,
} from "@/lib/schemas/project-schemas";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { encodeProjectName } from "@/lib/utils/project-url";
import { useToast } from "@/components/ui/toast-container";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function NewProjectPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;

  const { tenants } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.apiKey || "";
  const { success, error: showErrorToast } = useToast();
  const {
    createProject,
    loading,
    error: mutationError,
    clearError,
  } = useProjectMutations();
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
        `/tenants/${tenantId}/projects/${encodeProjectName(
          values.projectName
        )}/videos`
      );
    } catch (error) {
      handleError(error);
    }
  };

  const displayError = mutationError?.message || null;

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

  if (!tenant) {
    return (
      <ProtectedRoute>
        <ProjectLayout>
          <div className="flex items-center justify-center py-12">
            <ErrorMessage message="Tenant not found" />
          </div>
        </ProjectLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ProjectLayout>
        <div className="mx-auto max-w-2xl">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <CardTitle className="text-base font-semibold">
                Create New Project
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
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/tenants/${tenantId}/info`)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
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
      </ProjectLayout>
    </ProtectedRoute>
  );
}

