"use client";

import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { ProjectMetricsCards } from "@/components/project-metrics-cards";
import { ProjectSelector } from "@/components/project-selector";
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
import { PageHeader } from "@/components/ui/page-header";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useToast } from "@/components/ui/toast-container";
import { VideosTable } from "@/components/videos-table";
import { WebhookTestDialogControlled } from "@/components/webhook-test-dialog-controlled";
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { useProject } from "@/lib/hooks/use-project";
import { useProjectMutations, useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { useVideos } from "@/lib/hooks/use-videos";
import {
  projectFormSchema,
  ProjectFormValues,
} from "@/lib/schemas/project-schemas";
import { ApplicationError, ErrorCode } from "@/lib/types/errors";
import { formatDate } from "@/lib/utils/date-utils";
import { decodeProjectName, encodeProjectName } from "@/lib/utils/project-url";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Video,
  Webhook,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type SidebarSection = "tenant" | "project" | "videos";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sidebarSection, setSidebarSection] =
    useState<SidebarSection>("videos");
  const [testWebhookOpen, setTestWebhookOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);

  const tenantId = params?.tenantId as string;
  const projectName = params?.projectName
    ? decodeProjectName(params.projectName as string)
    : "";

  const { tenants } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.api_key || "";

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects(apiKey);

  const {
    project,
    loading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useProject(projectName, apiKey);

  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useVideos(projectName, apiKey);

  const { copyToClipboard, copiedId } = useClipboard();
  const { success, error: showErrorToast } = useToast();
  const {
    createProject,
    updateProject,
    loading: createProjectLoading,
    error: createProjectError,
    clearError: clearCreateProjectError,
  } = useProjectMutations();

  const createProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: "",
      webhookUrl: "",
    },
  });

  const handleProjectChange = (newProjectName: string) => {
    router.push(
      `/tenants/${tenantId}/projects/${encodeProjectName(newProjectName)}`
    );
  };

  const handleCreateProject = async (values: ProjectFormValues) => {
    clearCreateProjectError();
    try {
      await createProject(values, apiKey);
      setCreateProjectDialogOpen(false);
      createProjectForm.reset();
      success("Project created successfully!");
      refetchProjects();
    } catch (error) {
      const appError = error instanceof ApplicationError ? error : null;
      const errorMessage = appError?.message || "Failed to create project";

      if (appError?.code === ErrorCode.PROJECT_EXISTS) {
        showErrorToast("A project with this name already exists");
      } else if (appError?.code === ErrorCode.UNAUTHORIZED) {
        showErrorToast("Invalid API key. Please check your tenant API key.");
      } else {
        showErrorToast(errorMessage);
      }
    }
  };

  const handleCreateProjectDialogChange = (open: boolean) => {
    setCreateProjectDialogOpen(open);
    if (!open) {
      createProjectForm.reset();
      clearCreateProjectError();
    }
  };

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
      clearCreateProjectError();
    }
  };

  const handleSaveWebhook = async (values: { webhookUrl?: string }) => {
    if (!project) return;

    clearCreateProjectError();
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

    clearCreateProjectError();
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
        )}`
      );
    } else {
      router.push(`/tenants/${tenantId}`);
    }
  };

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

  const loading = projectLoading || videosLoading || projectsLoading;
  const error = projectError || videosError || projectsError;

  const renderContent = () => {
    if (loading && !project) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-4 py-12 text-center sm:px-6">
          <ErrorMessage message={error} className="mb-4" />
          <Button
            variant="outline"
            onClick={() => {
              if (projectError) {
                window.location.reload();
              } else if (videosError) {
                refetchVideos();
              } else if (projectsError) {
                refetchProjects();
              }
            }}
            aria-label="Retry"
          >
            Try again
          </Button>
        </div>
      );
    }

    if (!project) {
      return null;
    }

    switch (sidebarSection) {
      case "tenant":
        return (
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Tenant Information
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
                        {tenant?.organization}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        API Key
                      </label>
                      <code className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground">
                        <span className="break-all">{tenant?.api_key}</span>
                        {tenant?.api_key && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 ml-1 shrink-0"
                            aria-label="Copy API key"
                            onClick={() => copyToClipboard(tenant.api_key)}
                          >
                            {copiedId === tenant.api_key ? (
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
                      <p className="text-xs text-muted-foreground">
                        {tenant?.status}
                      </p>
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
                    <Button
                      onClick={() => setCreateProjectDialogOpen(true)}
                      size="sm"
                    >
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
        );

      case "project":
        return (
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
                    <DeleteProjectDialog
                      projectName={project.projectName}
                      onSuccess={handleDeleteProject}
                      apiKey={apiKey}
                    />
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
                              onClick={() =>
                                copyToClipboard(project.webhookUrl!)
                              }
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
              </CardContent>
            </Card>
          </div>
        );

      case "videos":
        return (
          <div className="space-y-6">
            <ProjectMetricsCards videos={videos} />

            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Videos
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {videos.length} {videos.length === 1 ? "video" : "videos"}{" "}
                    total
                  </CardDescription>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarRail />
          <SidebarHeader>
            <ProjectSelector
              projects={projects}
              currentProjectName={projectName}
              tenantOrganization={tenant?.organization}
              onSelectProject={handleProjectChange}
              onAddProject={() => setCreateProjectDialogOpen(true)}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSidebarSection("videos")}
                      isActive={sidebarSection === "videos"}
                    >
                      <Video strokeWidth={2} />
                      <span>Videos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSidebarSection("project")}
                      isActive={sidebarSection === "project"}
                    >
                      <FolderOpen strokeWidth={2} />
                      <span>Project Information</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSidebarSection("tenant")}
                      isActive={sidebarSection === "tenant"}
                    >
                      <Building2 strokeWidth={2} />
                      <span>Tenant Information</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="h-svh bg-background flex flex-col overflow-hidden">
            <PageHeader className="shrink-0">
              <PageHeader.Start>
                <SidebarTrigger />
              </PageHeader.Start>
              <PageHeader.End>
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
              </PageHeader.End>
            </PageHeader>

            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
                {renderContent()}
              </div>
            </main>
          </div>
        </SidebarInset>

        {project && project.webhookUrl && (
          <WebhookTestDialogControlled
            open={testWebhookOpen}
            onOpenChange={setTestWebhookOpen}
            webhookUrl={project.webhookUrl}
          />
        )}
        <Dialog
          open={createProjectDialogOpen}
          onOpenChange={handleCreateProjectDialogChange}
        >
          <DialogContent
            className="max-w-[95vw] sm:max-w-md"
            aria-describedby="create-project-description"
          >
            <Form {...createProjectForm}>
              <form
                onSubmit={createProjectForm.handleSubmit(handleCreateProject)}
              >
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription id="create-project-description">
                    Create a new project for this tenant.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={createProjectForm.control}
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
                            disabled={createProjectLoading}
                            aria-describedby="project-name-description project-name-error"
                            aria-invalid={
                              !!createProjectForm.formState.errors.projectName
                            }
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
                    control={createProjectForm.control}
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
                            disabled={createProjectLoading}
                            aria-describedby="webhook-url-description webhook-url-error"
                            aria-invalid={
                              !!createProjectForm.formState.errors.webhookUrl
                            }
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
                  {createProjectError?.message && (
                    <ErrorMessage
                      message={createProjectError.message}
                      role="alert"
                    />
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCreateProjectDialogChange(false)}
                    disabled={createProjectLoading}
                    aria-label="Cancel project creation"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProjectLoading}
                    aria-label={
                      createProjectLoading
                        ? "Creating project..."
                        : "Create project"
                    }
                  >
                    {createProjectLoading ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
                            disabled={createProjectLoading}
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
                  {createProjectError && (
                    <ErrorMessage
                      message={createProjectError.message}
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
                      disabled={createProjectLoading}
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
                    disabled={createProjectLoading}
                    aria-label="Cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProjectLoading}
                    aria-label={
                      createProjectLoading
                        ? "Saving..."
                        : project?.webhookUrl
                        ? "Update webhook URL"
                        : "Add webhook URL"
                    }
                  >
                    {createProjectLoading
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
      </SidebarProvider>
    </ProtectedRoute>
  );
}
