"use client";

import { useState, useEffect } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  Row,
  RowSelectionState,
} from "@tanstack/react-table";
import { MoreHorizontal, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeywordForm } from "@/components/keyword-form";
import { DeleteKeywordDialog } from "@/components/delete-keyword-dialog";
import { Loading, TableLoading } from "@/components/ui/loading";
import { PERMISSIONS, PermissionValue } from "@/lib/constants/permissions";
import { Checkbox } from "./ui/checkbox";
import { AssignGroupDialog } from "./assign-group-dialog";
import { Group } from "@/lib/generated/prisma";

interface Keyword {
  id: string;
  name: string;
  _count: {
    files: number;
    groups: number;
  };
}

export function FiltersContent({
  permissions,
}: {
  permissions: PermissionValue[];
}) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [deletingKeyword, setDeletingKeyword] = useState<Keyword | null>(null);
  const [deletingKeywordId, setDeletingKeywordId] = useState<string | null>(
    null
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const canUpdate = permissions.includes(PERMISSIONS.FILTERS_UPDATE);
  const canDelete = permissions.includes(PERMISSIONS.FILTERS_DELETE);

  const columns: ColumnDef<Keyword>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Sélectionner tous"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Sélectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Nom du mot-clé",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "_count.files",
      header: "Fichiers associés",
      cell: ({ row }) => {
        const count = row.original._count.files;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={count > 0 ? "default" : "secondary"}>
              {count} {count === 1 ? "fichier" : "fichiers"}
            </Badge>
            {count === 0 && (
              <span className="text-xs text-muted-foreground">Non utilisé</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "_count.groups",
      header: "Groups associés",
      cell: ({ row }) => {
        const count = row.original._count.groups;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={count > 0 ? "default" : "secondary"}>
              {count} {count === 1 ? "groupe" : "groupes"}
            </Badge>
            {count === 0 && (
              <span className="text-xs text-muted-foreground">Non utilisé</span>
            )}
          </div>
        );
      },
    },
    ...(permissions.includes(PERMISSIONS.FILTERS_DELETE) ||
    permissions.includes(PERMISSIONS.FILTERS_UPDATE)
      ? [
          {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }: { row: Row<Keyword> }) => {
              const keyword = row.original;
              const isDeleting = deletingKeywordId === keyword.id;

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loading variant="spinner" size="sm" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                      <span className="sr-only">Ouvrir le menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingKeyword(keyword)}
                      disabled={!canUpdate || isDeleting}
                      className={
                        !canUpdate ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setDeletingKeyword(keyword);
                        setDeletingKeywordId(keyword.id);
                      }}
                      className={`text-destructive ${
                        !canDelete ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={!canDelete || isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          },
        ]
      : []),
  ];

  const table = useReactTable({
    data: keywords,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,

    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const getSelectedKeywords = (): Keyword[] => {
    return selectedRows.map((row) => row.original);
  };

  const assignKeyword = async (keywordId: string, groupIds: string[]) => {
    const response = await fetch(`/api/keywords/${keywordId}?assign=true`, {
      method: "PUT",
      body: JSON.stringify({
        groupIds,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(data);
    } else {
      console.error(data);
    }
  };

  const handleBulkAssign = async (groupIds: string[]) => {
    setLoading(true);
    setError("");
    try {
      for (const keyword of selectedRows) {
        await assignKeyword(keyword.id, groupIds);
      }
      setLoading(false);
    } catch (error) {}
  };

  const clearSelection = () => {
    setRowSelection({});
  };

  const fetchGroups = async () => {
    try {
      setError("");
      const response = await fetch("/api/groups?includeHierarchy=true");
      const data = await response.json();

      if (response.ok) {
        setGroups(data);
      } else {
        setError(data.message || "Échec du chargement des groupes");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };
  const fetchKeywords = async () => {
    try {
      setSearching(true);
      setError("");
      const response = await fetch("/api/keywords");
      const data = await response.json();
      if (response.ok) {
        setKeywords(data);
      } else {
        setError(data.message || "Échec du chargement des mots-clés");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    fetchGroups();
  }, []);

  const handleSuccess = () => {
    fetchKeywords();
    setEditingKeyword(null);
    setDeletingKeyword(null);
    setRowSelection({});
    setDeletingKeywordId(null); // Clear the deleting state
  };

  const handleDeleteCancel = () => {
    setDeletingKeyword(null);
    setDeletingKeywordId(null); // Clear the deleting state when cancelled
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des mot-clés</CardTitle>
              <CardDescription>
                Gérer les mots-clés utilisés pour filtrer les fichiers
              </CardDescription>
            </div>
            {permissions.includes(PERMISSIONS.FILTERS_CREATE) && (
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un mot-clé
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer les mots-clés..."
                disabled
                className="pl-8"
              />
            </div>
          </div>
          <div className="rounded-md border">
            <TableLoading rows={5} />
          </div>
          <div className="flex items-center justify-center py-8">
            <Loading variant="dots" text="Chargement des mots-clés..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des filtres</CardTitle>
              <CardDescription>
                Gérer les mots-clés utilisés pour filtrer les fichiers
              </CardDescription>
            </div>
            {permissions.includes(PERMISSIONS.FILTERS_CREATE) && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un mot-clé
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer les mots-clés..."
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) => {
                  setSearching(true);
                  table.getColumn("name")?.setFilterValue(event.target.value);
                  setTimeout(() => setSearching(false), 200);
                }}
                className="pl-8"
              />
            </div>
            {hasSelection && (
              <Button
                variant={"secondary"}
                className="cursor-pointer"
                onClick={() => setShowBulkActionModal(true)}
              >
                Assigner au groupe
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {searching ? (
                  // Show loading skeleton during search
                  Array.from({ length: pagination.pageSize }).map(
                    (_, index) => (
                      <TableRow key={index}>
                        {columns.map((_, colIndex) => (
                          <TableCell key={colIndex}>
                            <div className="h-4 bg-muted animate-pulse rounded w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  )
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
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
                      className="h-24 text-center"
                    >
                      Aucun mot-clé trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Search Status */}
          {searching && (
            <div className="flex items-center justify-center py-2">
              <Loading
                variant="spinner"
                size="sm"
                text="Filtrage des mots-clés..."
              />
            </div>
          )}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Lignes par page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 15].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="text-sm text-muted-foreground">
                Affichage de{" "}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}{" "}
                à{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{" "}
                sur {table.getFilteredRowModel().rows.length} mot(s)-clé(s)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Précédent
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, table.getPageCount()) },
                    (_, i) => {
                      const pageIndex = table.getState().pagination.pageIndex;
                      const totalPages = table.getPageCount();
                      let startPage = Math.max(0, pageIndex - 2);
                      const endPage = Math.min(totalPages - 1, startPage + 4);
                      if (endPage - startPage < 4) {
                        startPage = Math.max(0, endPage - 4);
                      }
                      const page = startPage + i;
                      if (page > endPage) return null;
                      return (
                        <Button
                          key={page}
                          variant={page === pageIndex ? "default" : "outline"}
                          size="sm"
                          onClick={() => table.setPageIndex(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page + 1}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <KeywordForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={handleSuccess}
        />
        <KeywordForm
          open={!!editingKeyword}
          onOpenChange={(open) => !open && setEditingKeyword(null)}
          keyword={editingKeyword}
          onSuccess={handleSuccess}
        />
        <DeleteKeywordDialog
          open={!!deletingKeyword}
          onOpenChange={(open) => !open && handleDeleteCancel()}
          keyword={deletingKeyword}
          onSuccess={handleSuccess}
        />
      </Card>
      {showBulkActionModal && (
        <AssignGroupDialog
          open={showBulkActionModal}
          onOpenChange={setShowBulkActionModal}
          onSuccess={handleSuccess}
          onSave={handleBulkAssign}
          groups={groups}
        />
      )}
    </>
  );
}
