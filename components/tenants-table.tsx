"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Tenant } from "@/lib/store/api";
import { ExternalLink, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface TenantsTableProps {
  tenants: Tenant[];
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Tenant>[] = React.useMemo(
    () => [
      {
        accessorKey: "organization",
        header: "Organization",
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.getValue("organization")}
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("status")}
          </span>
        ),
        enableHiding: true,
      },
      {
        id: "actions",
        header: "Actions",
        meta: {
          align: "right",
        },
        cell: ({ row }) => {
          const tenant = row.original;
          return (
            <div className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tenants/${tenant.id}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </Button>
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [router]
  );

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
    <DataTable
      columns={columns}
      data={tenants}
      searchPlaceholder="Search tenants..."
      enableColumnVisibility={true}
      enablePagination={true}
      enableSorting={true}
      pageSize={10}
      emptyState={
        <div className="py-12 text-center text-muted-foreground">
          No tenants found matching your search.
        </div>
      }
    />
  );
}
