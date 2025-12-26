"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Check, Copy, FolderPlus } from "lucide-react";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { Project } from "@/lib/services/project-service";
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { formatDate } from "@/lib/utils/date-utils";

interface ProjectsTableProps {
  projects: Project[];
  onDelete: () => void;
}

/**
 * ProjectsTable Component
 *
 * Displays projects in a responsive table format.
 * Follows Composition Pattern with reusable sub-components.
 * Mobile-friendly with responsive design.
 */
export function ProjectsTable({ projects, onDelete }: ProjectsTableProps) {
  const { copyToClipboard, copiedId } = useClipboard();

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderPlus className="h-6 w-6 text-muted-foreground" />}
        title="No projects found"
        description="Create your first project to get started with API key management."
      />
    );
  }

  return (
    <div className="divide-y">
      {/* Desktop Table View */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
              <TableHead className="h-12 px-4 font-semibold sm:px-6">Project Name</TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">API Key</TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">Webhook URL</TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">Created</TableHead>
              <TableHead className="h-12 w-[100px] px-4 font-semibold text-right sm:px-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.project_id}
                className="border-b bg-card transition-colors hover:bg-muted/50"
              >
                <TableCell className="px-4 py-4 sm:px-6">
                  <div className="font-medium text-foreground">
                    {project.project_name || (
                      <span className="italic text-muted-foreground">
                        Unnamed Project
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <code className="max-w-xs truncate rounded bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground sm:max-w-md">
                      {project.project_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 hover:bg-muted"
                      onClick={() => copyToClipboard(project.project_id)}
                      title="Copy API key"
                      aria-label={`Copy API key ${project.project_id}`}
                    >
                      {copiedId === project.project_id ? (
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 sm:px-6">
                  {project.webhook_url ? (
                    <code className="block max-w-xs truncate rounded bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground sm:max-w-md">
                      {project.webhook_url}
                    </code>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  {formatDate(project.created_at)}
                </TableCell>
                <TableCell className="px-4 py-4 text-right sm:px-6">
                  <DeleteProjectDialog
                    projectId={project.project_id}
                    projectName={project.project_name}
                    onSuccess={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block space-y-4 p-4 md:hidden sm:p-6">
        {projects.map((project) => (
          <Card key={project.project_id} className="border shadow-sm">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {project.project_name || (
                      <span className="italic text-muted-foreground">
                        Unnamed Project
                      </span>
                    )}
                  </h3>
                </div>
                <DeleteProjectDialog
                  projectId={project.project_id}
                  projectName={project.project_name}
                  onSuccess={onDelete}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  API Key
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground">
                    {project.project_id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 hover:bg-muted"
                    onClick={() => copyToClipboard(project.project_id)}
                    title="Copy API key"
                    aria-label={`Copy API key ${project.project_id}`}
                  >
                    {copiedId === project.project_id ? (
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>
              {project.webhook_url && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Webhook URL
                  </p>
                  <code className="block break-all rounded bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground">
                    {project.webhook_url}
                  </code>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(project.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
