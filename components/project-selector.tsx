"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/layout/sidebar";
import { ChevronsUpDown, Folder, Plus } from "lucide-react";
import * as React from "react";

type ProjectSelectorProject = {
  projectName: string;
};

type ProjectSelectorProps = {
  projects: ProjectSelectorProject[];
  currentProjectName: string;
  tenantOrganization?: string;
  onSelectProject: (projectName: string) => void;
  onAddProject: () => void;
};

export function ProjectSelector({
  projects,
  currentProjectName,
  tenantOrganization,
  onSelectProject,
  onAddProject,
}: ProjectSelectorProps) {
  const { state, isMobile } = useSidebar();
  const [open, setOpen] = React.useState(false);

  if (!projects.length) return null;

  const isCollapsed = state === "collapsed" && !isMobile;
  const currentProject =
    projects.find((p) => p.projectName === currentProjectName) ??
    ({ projectName: currentProjectName } satisfies ProjectSelectorProject);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-12 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-center"
            aria-label="Select project"
          >
            <div className="h-8 w-8 rounded-md bg-black dark:bg-black flex items-center justify-center shrink-0">
              <Folder className="h-4 w-4 text-white shrink-0" strokeWidth={1.5} />
            </div>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-between gap-2 px-2 py-3 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Select project"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="h-8 w-8 rounded-md bg-black dark:bg-black flex items-center justify-center shrink-0">
                <Folder className="h-4 w-4 text-white shrink-0" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentProject.projectName}
                </span>
                {tenantOrganization && (
                  <span className="text-xs text-sidebar-foreground/70 truncate">
                    {tenantOrganization}
                  </span>
                )}
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        align={isCollapsed ? "start" : isMobile ? "end" : "start"}
        side={isCollapsed ? "right" : "bottom"}
        sideOffset={4}
        alignOffset={isCollapsed ? -4 : 0}
      >
        <div className="p-2">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Projects
          </div>
          <div className="space-y-1">
            {projects.map((p) => (
              <Button
                key={p.projectName}
                variant="ghost"
                className={`w-full justify-start gap-2 px-2 py-1.5 h-auto ${
                  p.projectName === currentProjectName
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => {
                  setOpen(false);
                  onSelectProject(p.projectName);
                }}
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span className="text-sm flex-1 text-left truncate">
                  {p.projectName}
                </span>
              </Button>
            ))}
          </div>
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-2 py-1.5 h-auto hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setOpen(false);
              onAddProject();
            }}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="text-sm">Add project</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}


