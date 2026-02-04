"use client";

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
} from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProjectSelector } from "@/components/project-selector";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTenants } from "@/lib/hooks/use-tenants";
import { decodeProjectName, encodeProjectName } from "@/lib/utils/project-url";
import { ArrowLeft, Building2, FileImage, FolderOpen } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface ProjectLayoutProps {
  children: ReactNode;
}

export function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantId = params?.tenantId as string;
  const projectName = params?.projectName
    ? decodeProjectName(params.projectName as string)
    : "";

  const { tenants } = useTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  const apiKey = tenant?.apiKey || "";

  const { projects } = useProjects(apiKey);

  const handleProjectChange = (newProjectName: string) => {
    router.push(
      `/tenants/${tenantId}/projects/${encodeProjectName(
        newProjectName
      )}/content`
    );
  };

  const handleAddProject = () => {
    router.push(`/tenants/${tenantId}/projects/new`);
  };

  const isContentPage = pathname?.endsWith("/content");
  const isProjectInfoPage =
    pathname?.includes("/projects/") && pathname?.endsWith("/info");
  const isTenantInfoPage = pathname === `/tenants/${tenantId}/info`;
  const hasProjects = projects.length > 0;
  const firstProject = hasProjects ? projects[0] : null;

  // Determine which project to use for navigation
  const activeProjectName = projectName || (firstProject?.projectName ?? "");

  const handleNavigateToContent = () => {
    if (projectName) {
      router.push(
        `/tenants/${tenantId}/projects/${encodeProjectName(projectName)}/content`
      );
    } else if (firstProject) {
      router.push(
        `/tenants/${tenantId}/projects/${encodeProjectName(
          firstProject.projectName
        )}/content`
      );
    }
  };

  const handleNavigateToProjectInfo = () => {
    if (projectName) {
      router.push(
        `/tenants/${tenantId}/projects/${encodeProjectName(projectName)}/info`
      );
    } else if (firstProject) {
      router.push(
        `/tenants/${tenantId}/projects/${encodeProjectName(
          firstProject.projectName
        )}/info`
      );
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader>
          {hasProjects && (
            <ProjectSelector
              projects={projects}
              currentProjectName={activeProjectName}
              tenantOrganization={tenant?.organization}
              onSelectProject={handleProjectChange}
              onAddProject={handleAddProject}
            />
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hasProjects && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={handleNavigateToContent}
                        isActive={isContentPage}
                      >
                        <FileImage strokeWidth={2} />
                        <span>Content</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={handleNavigateToProjectInfo}
                        isActive={isProjectInfoPage}
                      >
                        <FolderOpen strokeWidth={2} />
                        <span>Project Information</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push(`/tenants/${tenantId}/info`)}
                    isActive={isTenantInfoPage}
                  >
                    <Building2 strokeWidth={2} />
                    <span>Account Information</span>
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
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
