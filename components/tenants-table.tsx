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
import { Tenant } from "@/lib/services/tenant-service";
import { ExternalLink, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TenantsTableProps {
  tenants: Tenant[];
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  const router = useRouter();

  if (tenants.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6 text-muted-foreground" />}
        title="No tenants found"
        description="Create your first tenant to get started with project management."
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
                Organization
              </TableHead>
              <TableHead className="h-12 px-4 font-semibold sm:px-6">
                Status
              </TableHead>
              <TableHead className="h-12 w-[200px] px-4 font-semibold text-right sm:px-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow
                key={tenant.id}
                className="border-b bg-card transition-colors hover:bg-muted/50"
              >
                <TableCell className="px-4 py-4 sm:px-6">
                  <div className="font-medium text-foreground">
                    {tenant.organization}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground sm:px-6">
                  {tenant.status}
                </TableCell>
                <TableCell className="px-4 py-4 text-right sm:px-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/tenants/${tenant.id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="block space-y-4 p-4 md:hidden sm:p-6">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="border shadow-sm">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {tenant.organization}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/tenants/${tenant.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Status
                </p>
                <p className="text-sm text-muted-foreground">
                  {tenant.status}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

