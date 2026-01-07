"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Project } from "@/lib/store/api";
import { encodeProjectName } from "@/lib/utils/project-url";
import { formatDate } from "@/lib/utils/date-utils";
import { ExternalLink, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface ProjectsTableProps {
  projects: Project[];
  onDelete: () => void;
  apiKey: string;
  tenantId: string;
}

export function ProjectsTable({ projects, onDelete, apiKey, tenantId }: ProjectsTableProps) {
  const router = useRouter();

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
    <div className="divide-y">
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Project Name
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Created
              </TableHead>
              <TableHead className="h-12 w-[200px] px-4 font-semibold text-right sm:px-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="border-b bg-card transition-colors hover:bg-muted/50"
              >
                <TableCell className="px-4 py-4 sm:px-6">
                  <div className="font-medium text-foreground">
                    {project.projectName}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  {formatDate(project.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-4 text-right sm:px-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/tenants/${tenantId}/projects/${encodeProjectName(project.projectName)}`
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="block space-y-4 p-4 md:hidden sm:p-6">
        {projects.map((project) => (
          <Card key={project.id} className="border shadow-sm">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {project.projectName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/tenants/${tenantId}/projects/${encodeProjectName(project.projectName)}`
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
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(project.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
