"use client";

import * as React from "react";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // server-side mode
  manualPagination?: boolean;
  pageCount?: number;
  rowCount?: number;

  pagination?: PaginationState;
  onPaginationChange?: (updater: Updater<PaginationState>) => void;

  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (updater: Updater<SortingState>) => void;

  isLoading?: boolean;
  className?: string;
};

export function DataTable<TData, TValue>({
  columns,
  data,

  manualPagination = false,
  pageCount,
  rowCount,

  pagination,
  onPaginationChange,

  manualSorting = false,
  sorting,
  onSortingChange,

  isLoading = false,
  className,
}: DataTableProps<TData, TValue>) {
  const [innerPagination, setInnerPagination] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    }
  );

  const [innerSorting, setInnerSorting] = React.useState<SortingState>([]);

  const resolvedPagination = pagination ?? innerPagination;
  const resolvedSorting = sorting ?? innerSorting;

  const resolvedOnPaginationChange = onPaginationChange ?? setInnerPagination;
  const resolvedOnSortingChange = onSortingChange ?? setInnerSorting;

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: resolvedPagination,
      sorting: resolvedSorting,
    },
    onPaginationChange: resolvedOnPaginationChange,
    onSortingChange: resolvedOnSortingChange,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),

    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,

    manualSorting,
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative rounded-md border">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id} className="font-semibold">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1",
                            canSort
                              ? "cursor-pointer select-none"
                              : "cursor-default"
                          )}
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className="text-muted-foreground">
                              {sortDir === "asc"
                                ? "▲"
                                : sortDir === "desc"
                                ? "▼"
                                : ""}
                            </span>
                          )}
                        </button>
                      )}
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
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucune donnée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="text-sm text-muted-foreground">
          {typeof rowCount === "number" ? (
            <>
              Total :{" "}
              <span className="font-medium text-foreground">{rowCount}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes :</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-22.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground tabular-nums">
            Page{" "}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            sur{" "}
            <span className="font-medium text-foreground">
              {table.getPageCount()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
