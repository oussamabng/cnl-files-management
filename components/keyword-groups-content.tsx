"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { Loading, TableLoading } from "@/components/ui/loading";
import { PERMISSIONS, PermissionValue } from "@/lib/constants/permissions";
import { KeywordForm } from "@/components/keyword-form";
import { KeywordGroupForm } from "./keyword-group-form";
import { DeleteDialog } from "./delete-dialog";

interface Keyword {
  id: string;
  name: string;
  _count?: {
    files: number;
  };
  groupLinks?: { id: string; group: { id: string; name: string } }[];
}

interface KeywordGroup {
  id: string;
  name: string;
  description?: string | null;
  slug?: string;
  isActive?: boolean;
  keywords?: { id: string; name: string }[];
  _count?: {
    keywords: number;
  };
}

export function KeywordGroupsContent({
  permissions,
}: {
  permissions: PermissionValue[];
}) {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KeywordGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "groups">("groups");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [deletingKeyword, setDeletingKeyword] = useState<Keyword | null>(null);

  const canCreate = permissions.includes(PERMISSIONS.FILTERS_CREATE);
  const canUpdate = permissions.includes(PERMISSIONS.FILTERS_UPDATE);
  const canDelete = permissions.includes(PERMISSIONS.FILTERS_DELETE);

  // Fetch groups + keywords
  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      // fetch groups and keywords in parallel
      const [gRes, kRes] = await Promise.all([
        fetch("/api/keyword-groups"),
        fetch("/api/keywords"),
      ]);

      const gJson = await gRes.json();
      const kJson = await kRes.json();

      if (!gRes.ok)
        throw new Error(gJson?.message || "Échec du chargement des groupes");
      if (!kRes.ok)
        throw new Error(kJson?.message || "Échec du chargement des mots-clés");

      // Normalize groups (some responses include keywords as { keyword: { id,name } })
      const normalizedGroups = (gJson || []).map((g: any) => {
        let kws: { id: string; name: string }[] = [];
        if (Array.isArray(g.keywords)) {
          // handle both shapes
          kws = g.keywords.map((l: any) =>
            l.keyword
              ? { id: l.keyword.id, name: l.keyword.name }
              : { id: l.id, name: l.name }
          );
        }
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          slug: g.slug,
          isActive: g.isActive,
          keywords: kws,
          _count: g._count,
        } as KeywordGroup;
      });

      setGroups(normalizedGroups);
      setKeywords(kJson || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const columns: ColumnDef<KeywordGroup>[] = [
    {
      accessorKey: "name",
      header: "Nom du groupe",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "_count.keywords",
      header: "Mots-clés",
      cell: ({ row }) => {
        const count =
          row.original._count?.keywords ?? row.original.keywords?.length ?? 0;
        return (
          <Badge variant={count > 0 ? "default" : "secondary"}>{count}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<KeywordGroup> }) => {
        const group = row.original;
        const isDeleting = deletingGroupId === group.id;
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setEditingGroup(group)}
                disabled={!canUpdate || isDeleting}
              >
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeletingGroupId(group.id)}
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
  ];

  const table = useReactTable({
    data: groups,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, pagination },
  });

  const confirmDeleteGroup = async (groupId: string | null) => {
    if (!groupId) return;
    try {
      setError("");
      const res = await fetch(`/api/keyword-groups/${groupId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || data?.error || "Erreur suppression");
      // refresh
      await fetchAll();
      setDeletingGroupId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur s'est produite");
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleExpanded = (groupId: string) => {
    const s = new Set(expandedGroups);
    if (s.has(groupId)) s.delete(groupId);
    else s.add(groupId);
    setExpandedGroups(s);
  };

  const groupedMap = new Map<
    string,
    { group?: KeywordGroup; keywords: Keyword[] }
  >();
  groups.forEach((g) => groupedMap.set(g.id, { group: g, keywords: [] }));

  const ungrouped: Keyword[] = [];
  for (const kw of keywords) {
    const link =
      kw.groupLinks && kw.groupLinks.length > 0 ? kw.groupLinks[0].group : null;
    if (kw.groupLinks && kw.groupLinks.length > 0) {
      kw.groupLinks!.forEach((l) => {
        const item = groupedMap.get(l.group.id);
        if (item) item.keywords.push(kw);
      });
    } else {
      ungrouped.push(kw);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des groupes de mots-clés</CardTitle>
              <CardDescription>
                Gérer les groupes et assigner des mots-clés
              </CardDescription>
            </div>
            {canCreate && (
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Créer un groupe
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." disabled className="pl-8" />
            </div>
          </div>
          <div className="rounded-md border">
            <TableLoading rows={5} />
          </div>
          <div className="flex items-center justify-center py-8">
            <Loading variant="dots" text="Chargement des groupes..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des groupes de mots-clés</CardTitle>
            <CardDescription>
              Gérer les groupes et assigner des mots-clés
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <Button onClick={() => setShowCreateGroup(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un groupe
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              onChange={(e) => {
                setSearching(true);
                /* we can implement filtering later */ setTimeout(
                  () => setSearching(false),
                  200
                );
              }}
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from(groupedMap.values()).map((entry) => {
            const grp = entry.group!;
            const isExp = expandedGroups.has(grp.id);
            return (
              <div key={grp.id} className="border rounded-md overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-muted/10 cursor-pointer"
                  onClick={() => toggleExpanded(grp.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      {isExp ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{grp.name}</div>
                      {grp.description && (
                        <div className="text-xs text-muted-foreground">
                          {grp.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {grp.keywords?.length ?? 0} mots-clés
                    </Badge>
                    <div className="flex items-center gap-2">
                      {canUpdate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(grp);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingGroupId(grp.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {isExp && (
                  <div className="p-3">
                    {entry.keywords.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        Aucun mot-clé dans ce groupe.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {entry.keywords.map((kw) => (
                          <div
                            key={kw.id}
                            className="flex items-center justify-between gap-4 p-2 border rounded-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="font-medium truncate">
                                {kw.name}
                              </div>

                              <Badge
                                variant={
                                  kw._count ?kw._count?.files > 0 ? "default" : "secondary" : "secondary"
                                }
                              >
                                {kw._count?.files}{" "}
                                {kw._count?.files === 1
                                  ? "fichier"
                                  : "fichiers"}
                              </Badge>
                              {kw._count?.files === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Non utilisé
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {canUpdate && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingKeyword(kw);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setDeletingKeyword(kw);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <KeywordGroupForm
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onSuccess={fetchAll}
      />
      <KeywordGroupForm
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        group={editingGroup}
        onSuccess={fetchAll}
      />

      <KeywordForm
        open={!!editingKeyword}
        keyword={editingKeyword}
        onOpenChange={(open) => !open && setEditingKeyword(null)}
        onSuccess={fetchAll}
      />

      <DeleteDialog
        open={!!deletingKeyword}
        title="Supprimer le mot-clé"
        description={
          deletingKeyword
            ? `Voulez-vous vraiment supprimer "${deletingKeyword.name}" ? Cette action est irréversible.`
            : undefined
        }
        onClose={() => setDeletingKeyword(null)}
        onConfirm={async () => {
          if (!deletingKeyword) return;
          try {
            const res = await fetch(`/api/keywords/${deletingKeyword.id}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Erreur suppression");
            await fetchAll();
            setDeletingKeyword(null);
          } catch (err: any) {
            console.error(err);
            alert(err.message || "Une erreur est survenue");
          }
        }}
      />

      <DeleteDialog
        open={!!deletingGroupId}
        title="Supprimer le groupe"
        description="Voulez-vous vraiment supprimer ce groupe ? Cette action est irréversible."
        onClose={() => setDeletingGroupId(null)}
        onConfirm={() => confirmDeleteGroup(deletingGroupId)}
      />
    </Card>
  );
}
