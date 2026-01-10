"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, List, Search } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  enableSorting?: boolean;
  emptyState?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchValue: controlledSearchValue,
  onSearchChange,
  enableColumnVisibility = false,
  enablePagination = false,
  pageSize = 10,
  enableSorting = false,
  emptyState,
  headerActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const initialColumnVisibility = React.useMemo(() => {
    const visibility: VisibilityState = {};
    columns.forEach((col) => {
      const accessorKey =
        "accessorKey" in col
          ? (col.accessorKey as string | undefined)
          : undefined;
      const colId = "id" in col ? (col.id as string | undefined) : undefined;
      const key = accessorKey || colId;

      if (
        key &&
        "meta" in col &&
        col.meta &&
        typeof col.meta === "object" &&
        "defaultHidden" in col.meta
      ) {
        if (col.meta.defaultHidden === true) {
          visibility[key] = false;
        }
      } else if (key && "defaultHidden" in col && col.defaultHidden === true) {
        visibility[key] = false;
      }
    });
    return visibility;
  }, [columns]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState({});
  const [internalSearchValue, setInternalSearchValue] = React.useState("");

  const searchValue = controlledSearchValue ?? internalSearchValue;
  const handleSearchChange = onSearchChange ?? setInternalSearchValue;

  const filteredData = React.useMemo(() => {
    if (!searchValue?.trim()) return data;

    const search = searchValue.toLowerCase().trim();
    return data.filter((row: TData) => {
      return columns.some((col) => {
        const accessorKey =
          "accessorKey" in col
            ? (col.accessorKey as string | undefined)
            : undefined;
        const colId = "id" in col ? (col.id as string | undefined) : undefined;
        const key = accessorKey || colId;

        if (!key || typeof key !== "string") return false;

        const rowRecord = row as Record<string, unknown>;
        let cellValue: unknown;
        if (accessorKey && typeof rowRecord[accessorKey] !== "undefined") {
          cellValue = rowRecord[accessorKey];
        } else if (colId && typeof rowRecord[colId] !== "undefined") {
          cellValue = rowRecord[colId];
        } else {
          return false;
        }

        if (cellValue == null) return false;
        const stringValue = String(cellValue).toLowerCase();
        return stringValue.includes(search);
      });
    });
  }, [data, searchValue, columns]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {headerActions}
          {enableColumnVisibility && (
            <>
              {headerActions && <div className="w-px h-4 bg-border" />}
              <ColumnVisibilityDropdown table={table} />
            </>
          )}
        </div>
      </div>

      <div className="rounded-md border pb-1">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const meta = header.column.columnDef.meta as
                    | { align?: "left" | "right" | "center" }
                    | undefined;
                  const align = meta?.align || "left";
                  const isRightAligned = align === "right";
                  return (
                    <TableHead
                      key={header.id}
                      className={`h-8 px-2 sm:px-3 ${
                        isRightAligned ? "text-right" : ""
                      }`}
                      style={{ cursor: canSort ? "pointer" : "default" }}
                      onClick={
                        canSort && enableSorting
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          isRightAligned ? "justify-end" : ""
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && enableSorting && (
                          <span className="text-primary">
                            {{
                              asc: <ArrowUp className="h-4 w-4" />,
                              desc: <ArrowDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b bg-card transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-1.5 sm:px-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState || "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} result(s)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ColumnVisibilityDropdownProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
}

function ColumnVisibilityDropdown<TData>({
  table,
}: ColumnVisibilityDropdownProps<TData>) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <List className="h-4 w-4" />
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md border bg-card shadow-lg">
            <div className="p-2">
              <Label className="mb-2 block text-sm font-medium">
                Toggle columns
              </Label>
              <div className="space-y-1">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        onChange={(e) =>
                          column.toggleVisibility(e.target.checked)
                        }
                      />
                      <span className="truncate">
                        {typeof column.columnDef.header === "string"
                          ? column.columnDef.header
                          : column.id}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
