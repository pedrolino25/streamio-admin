"use client";

import { CreateTenantDialog } from "@/components/dialogs/create-tenant-dialog";
import { TenantsTable } from "@/components/tables/tenants-table";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
import { useAuth } from "@/lib/auth-context";
import { useTenants } from "@/lib/hooks/use-tenants";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { tenants, loading, error, refetch } = useTenants();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/signin");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <PageHeader>
          <PageHeader.Start>
            <PageHeader.Text>
              <PageHeader.Title>Streamio Platform</PageHeader.Title>
              <PageHeader.Description>
                Manage tenants and projects for the Streamio Platform
              </PageHeader.Description>
            </PageHeader.Text>
          </PageHeader.Start>
          <PageHeader.End>
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
          </PageHeader.End>
        </PageHeader>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-card px-3 py-2 sm:px-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    All Tenants
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {tenants.length}{" "}
                    {tenants.length === 1 ? "tenant" : "tenants"} total
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CreateTenantDialog onSuccess={refetch} />
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
                    aria-label="Retry fetching tenants"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="p-3">
                  <TenantsTable tenants={tenants} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
