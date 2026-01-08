"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Project } from "@/lib/store/api";
import { encodeProjectName } from "@/lib/utils/project-url";
import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Folder, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DeleteProjectDialog } from "@/components/dialogs/delete-project-dialog";

interface ProjectsTableProps {
  projects: Project[];
  onDelete: () => void;
  apiKey: string;
  tenantId: string;
}

export function ProjectsTable({
  projects,
  onDelete,
  apiKey,
  tenantId,
}: ProjectsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Project>[] = React.useMemo(
    () => [
      {
        accessorKey: "projectName",
        header: "Project Name",
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.getValue("projectName")}
          </div>
        ),
        enableHiding: false,
      },
      {
        id: "actions",
        header: "Actions",
        meta: {
          align: "right",
        },
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/tenants/${tenantId}/projects/${encodeProjectName(
                      project.projectName
                    )}`
                  )
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </Button>
              <DeleteProjectDialog
                projectName={project.projectName}
                onSuccess={onDelete}
                apiKey={apiKey}
              />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [router, tenantId, apiKey, onDelete]
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderPlus className="h-6 w-6 text-muted-foreground" />}
        title="No projects found"
        description="Create your first project to get started."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={projects}
      searchPlaceholder="Search projects..."
      enablePagination
      enableSorting
      pageSize={10}
      emptyState={
        <EmptyState
          icon={<Folder className="h-6 w-6 text-muted-foreground" />}
          title="No projects found"
          description="Create your first project to get started."
        />
      }
    />
  );
}
