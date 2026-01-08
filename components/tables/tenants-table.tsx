"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Tenant } from "@/lib/store/api";
import { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
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
        cell: ({ row }) => {
          const tenant = row.original;
          return (
            <div
              className="font-medium text-foreground underline cursor-pointer hover:text-primary transition-colors"
              onClick={() => router.push(`/tenants/${tenant.id}`)}
            >
              {row.getValue("organization")}
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: {
          align: "right",
        },
        cell: ({ row }) => {
          const statusValue = String(row.getValue("status"));
          const status = statusValue.toUpperCase();
          const isActive = statusValue.toLowerCase() === "active";
          return (
            <div className="text-right">
              <Badge
                variant={isActive ? "outline" : "destructive"}
                className={
                  isActive
                    ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                    : ""
                }
              >
                {status}
              </Badge>
            </div>
          );
        },
        enableHiding: true,
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
      enableColumnVisibility
      enablePagination
      enableSorting
      pageSize={10}
      emptyState={
        <div className="py-12 text-center text-muted-foreground">
          No tenants found matching your search.
        </div>
      }
    />
  );
}
