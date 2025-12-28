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
import { WebhookTestDialog } from "@/components/webhook-test-dialog";
import { useAuth } from "@/lib/auth-context";
import { useProjects } from "@/lib/hooks/use-projects";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { projects, loading, error, refetch } = useProjects();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/signin");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Streamio Platform"
          description="Manage API keys and webhooks for the Streamio Platform"
          actions={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    All Projects
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {projects.length}{" "}
                    {projects.length === 1 ? "project" : "projects"} total
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <WebhookTestDialog />
                  <CreateProjectDialog onSuccess={refetch} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-card p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : error ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <ErrorMessage message={error} className="mb-4" />
                  <Button
                    variant="outline"
                    onClick={refetch}
                    aria-label="Retry fetching projects"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <ProjectsTable projects={projects} onDelete={refetch} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
