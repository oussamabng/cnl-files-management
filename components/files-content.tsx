/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  Upload,
  Filter,
  Folder,
  X,
  Home,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { FileEditDialog } from "@/components/file-edit-dialog";
import { DeleteFileDialog } from "@/components/delete-file-dialog";
import { FileOpener } from "@/components/file-opener";
import { Loading, TableLoading } from "@/components/ui/loading";
import { FolderSelector } from "@/components/folder-selector";
import { KeywordMultiselect } from "@/components/keyword-multiselect";
import { SimpleDateRangePicker } from "@/components/simple-date-range-picker";
import { CommentDisplay } from "@/components/comment-display";

interface FileData {
  id: string;
  name: string;
  path: string;
  keywords: Array<{ id: string; name: string }>;
  folder?: { id: string; name: string } | null;
  folderPath?: string;
  dateTexte?: string | null;
  commentaire?: string | null;
}

interface Keyword {
  id: string;
  name: string;
}

export function FilesContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // Filter states
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"AND" | "OR">("OR");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingFile, setEditingFile] = useState<FileData | null>(null);
  const [deletingFile, setDeletingFile] = useState<FileData | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<string>("");
  const [folderMap, setFolderMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (err) {
        console.error("Échec de la récupération du rôle utilisateur:", err);
      }
    };
    fetchUserRole();
  }, []);

  // Fetch folder hierarchy to build path map
  const fetchFolderPaths = async () => {
    try {
      const response = await fetch("/api/folders?includeHierarchy=true");
      if (response.ok) {
        const folders = await response.json();
        const pathMap = new Map<string, string>();

        // Build folder path map
        folders.forEach((folder: any) => {
          const path = calculateFolderPath(folder.id, folders);
          pathMap.set(folder.id, path);
        });

        setFolderMap(pathMap);
      }
    } catch (err) {
      console.error("Échec de la récupération des chemins de dossiers:", err);
    }
  };

  const calculateFolderPath = (folderId: string, folders: any[]): string => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return "";

    if (!folder.parentId) {
      return folder.name;
    }

    const parentPath = calculateFolderPath(folder.parentId, folders);
    return `${parentPath} / ${folder.name}`;
  };

  useEffect(() => {
    fetchFolderPaths();
  }, []);

  const columns: ColumnDef<FileData>[] = [
    {
      accessorKey: "name",
      header: "Nom du fichier",
      cell: ({ row }) => (
        <FileOpener
          fileName={row.getValue("name")}
          filePath={row.original.path}
        />
      ),
    },
    {
      accessorKey: "folder",
      header: "Emplacement",
      cell: ({ row }) => {
        const folder = row.original.folder;
        const folderPath = folder ? folderMap.get(folder.id) : null;

        if (!folder) {
          return (
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Racine</span>
            </div>
          );
        }

        // Show only the last folder name, but full path in tooltip
        const displayName = folder.name;
        const fullPath = folderPath || folder.name;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 min-w-0 max-w-[200px] cursor-help">
                  <Folder className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span
                    className="text-sm text-muted-foreground truncate"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="break-words">
                  <strong>Chemin complet :</strong>
                  <br />
                  {fullPath}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "dateTexte",
      header: "Date personnalisée",
      cell: ({ row }) => {
        const dateTexte = row.original.dateTexte;
        if (!dateTexte) {
          return (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">Non définie</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-blue-600" />
            <span className="text-sm">
              {format(new Date(dateTexte), "dd MMM yyyy", { locale: fr })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "commentaire",
      header: "Commentaire",
      cell: ({ row }) => {
        const commentaire = row.original.commentaire || null;
        return (
          <div className="w-full max-w-[250px]">
            <CommentDisplay
              commentaire={commentaire}
              fileName={row.original.name}
            />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "keywords",
      header: "Mots-clés",
      cell: ({ row }) => {
        const keywords = row.original.keywords;
        const maxVisible = 2;

        if (keywords.length === 0) {
          return <span className="text-xs text-muted-foreground">Aucun</span>;
        }

        if (keywords.length <= maxVisible) {
          return (
            <div className="flex flex-wrap gap-1">
              {keywords.map((keyword) => (
                <Badge key={keyword.id} variant="outline" className="text-xs">
                  {keyword.name}
                </Badge>
              ))}
            </div>
          );
        }

        const visibleKeywords = keywords.slice(0, maxVisible);
        const remainingCount = keywords.length - maxVisible;
        const allKeywordNames = keywords.map((k) => k.name).join(", ");

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-wrap gap-1 cursor-help">
                  {visibleKeywords.map((keyword) => (
                    <Badge
                      key={keyword.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {keyword.name}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    +{remainingCount}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="break-words">
                  <strong>Tous les mots-clés :</strong>
                  <br />
                  {allKeywordNames}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    ...(userRole === "admin"
      ? [
          {
            id: "actions" as const,
            header: "Actions",
            enableHiding: false,
            cell: ({ row }: { row: any }) => {
              const file = row.original;
              const isDeleting = deletingFileId === file.id;

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
                      onClick={() => setEditingFile(file)}
                      disabled={isDeleting}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setDeletingFile(file);
                        setDeletingFileId(file.id);
                      }}
                      className="text-destructive"
                      disabled={isDeleting}
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
    data: files,
    columns,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination,
    },
    getRowId: (row) => row.id,
  });

  const fetchFiles = useCallback(async () => {
    try {
      setSearching(true);
      setError("");

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedKeywords.length > 0) {
        params.append("keywords", selectedKeywords.join(","));
        params.append("mode", filterMode);
      }
      // Only add folderId if a specific folder is selected
      if (selectedFolderId) {
        params.append("folderId", selectedFolderId);
      }
      // Add date range filters
      if (dateRange?.from) {
        params.append("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("dateTo", dateRange.to.toISOString());
      }
      params.append("sortBy", "name");
      params.append("sortOrder", "asc");

      const response = await fetch(`/api/files?${params}`);

      if (response.ok) {
        const data = await response.json();
        // Add folder paths to files
        const filesWithPaths = data.map((file: FileData) => ({
          ...file,
          folderPath: file.folder ? folderMap.get(file.folder.id) : null,
        }));
        setFiles(filesWithPaths);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Échec du chargement des fichiers");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, [
    searchTerm,
    selectedKeywords,
    filterMode,
    selectedFolderId,
    dateRange,
    folderMap,
  ]);

  const fetchKeywords = async () => {
    try {
      const response = await fetch("/api/keywords");
      if (response.ok) {
        const data = await response.json();
        setKeywords(data);
      }
    } catch (err) {
      console.error("Échec de la récupération des mots-clés:", err);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFiles();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchFiles]);

  const clearAllFilters = () => {
    setSelectedKeywords([]);
    setSearchTerm("");
    setSelectedFolderId(null);
    setSelectedFolderName("");
    setDateRange(undefined);
  };

  const removeSearchFilter = () => {
    setSearchTerm("");
  };

  const removeFolderFilter = () => {
    setSelectedFolderId(null);
    setSelectedFolderName("");
  };

  const removeDateFilter = () => {
    setDateRange(undefined);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    // Get folder path for display
    if (folderId && folderMap.has(folderId)) {
      setSelectedFolderName(folderMap.get(folderId) || "Dossier sélectionné");
    } else {
      setSelectedFolderName("");
    }
  };

  const handleSuccess = () => {
    fetchFiles();
    setEditingFile(null);
    setDeletingFile(null);
    setDeletingFileId(null);
  };

  const handleDeleteCancel = () => {
    setDeletingFile(null);
    setDeletingFileId(null);
  };

  const handleUploadSuccess = () => {
    fetchFiles();
    fetchFolderPaths();
  };

  const hasActiveFilters = searchTerm || selectedFolderId || dateRange?.from;

  if (loading && files.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestion des fichiers</CardTitle>
                <CardDescription>
                  Rechercher, filtrer et gérer vos fichiers
                </CardDescription>
              </div>
              <Button disabled>
                <Upload className="mr-2 h-4 w-4" />
                Télécharger des fichiers
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
            <div className="rounded-md border">
              <TableLoading rows={5} />
            </div>
            <div className="flex items-center justify-center py-8">
              <Loading variant="dots" text="Chargement des fichiers..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des fichiers</CardTitle>
              <CardDescription>
                Rechercher, filtrer et gérer vos fichiers
              </CardDescription>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Télécharger des fichiers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Rechercher des fichiers
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Folder Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtrer par dossier</Label>
              <FolderSelector
                selectedFolderId={selectedFolderId}
                onFolderSelect={handleFolderSelect}
                placeholder="Tous les dossiers"
                showCounts={true}
              />
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtrer par date</Label>
              <SimpleDateRangePicker
                //@ts-ignore
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Sélectionner une période..."
              />
            </div>

            {/* Filter Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mode de filtrage</Label>
              <RadioGroup
                value={filterMode}
                onValueChange={(value: "AND" | "OR") => setFilterMode(value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OR" id="or" />
                  <Label htmlFor="or" className="text-sm cursor-pointer">
                    OU
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="AND" id="and" />
                  <Label htmlFor="and" className="text-sm cursor-pointer">
                    ET
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium text-blue-800">
                    Filtres actifs
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 px-3 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  Effacer tout
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white border-blue-300 text-blue-800"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    Recherche : {searchTerm}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeSearchFilter}
                      className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {selectedFolderId && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white border-blue-300 text-blue-800 max-w-xs"
                  >
                    <Folder className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate" title={selectedFolderName}>
                      Dossier : {selectedFolderName || "Sélectionné"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFolderFilter}
                      className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}

                {dateRange?.from && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white border-blue-300 text-blue-800"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Date : {format(dateRange.from, "dd/MM/yy", { locale: fr })}
                    {dateRange.to &&
                      ` - ${format(dateRange.to, "dd/MM/yy", { locale: fr })}`}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeDateFilter}
                      className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Keywords Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Mots-clés
            </Label>
            <KeywordMultiselect
              keywords={keywords}
              selectedKeywords={selectedKeywords}
              onSelectionChange={setSelectedKeywords}
              placeholder="Rechercher et sélectionner des mots-clés..."
            />
          </div>

          <Separator />

          {/* Files Table */}
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
                    <TableRow key={row.id}>
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
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">
                          Aucun fichier trouvé
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                          >
                            Effacer les filtres pour voir tous les fichiers
                          </Button>
                        )}
                      </div>
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
                text="Recherche de fichiers..."
              />
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between">
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
                sur {table.getFilteredRowModel().rows.length} fichier(s)
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
      </Card>

      {/* Dialogs */}
      <FileUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        keywords={keywords}
        currentFolderId={selectedFolderId}
        onSuccess={handleUploadSuccess}
      />

      {userRole === "admin" && (
        <>
          <FileEditDialog
            open={!!editingFile}
            onOpenChange={(open) => !open && setEditingFile(null)}
            file={editingFile}
            keywords={keywords}
            onSuccess={handleSuccess}
          />

          <DeleteFileDialog
            open={!!deletingFile}
            onOpenChange={(open) => !open && handleDeleteCancel()}
            file={deletingFile}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
