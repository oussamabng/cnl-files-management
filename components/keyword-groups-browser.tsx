"use client";

import { useEffect, useState } from "react";
import {
  Folder,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Loading } from "@/components/ui/loading";
import { PERMISSIONS, PermissionValue } from "@/lib/constants/permissions";
import { KeywordGroupForm } from "./keyword-group-form";
import { DeleteDialog } from "./delete-dialog";
import { AssignKeywordsDialog } from "./assign-keywords-dialog";

interface Keyword {
  id: string;
  name: string;
  fileCount: number;
}

interface KeywordGroup {
  id: string;
  name: string;
  parentId?: string | null;
  children?: KeywordGroup[];
  keywords?: Keyword[];
  _count?: { keywords: number; children: number };
}

interface KeywordGroupsBrowserProps {
  permissions: PermissionValue[];
  currentGroupId: string | null;
  onGroupChange: (id: string | null) => void;
}

export function KeywordGroupsBrowser({
  permissions,
  currentGroupId,
  onGroupChange,
}: KeywordGroupsBrowserProps) {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Dialogs
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KeywordGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<KeywordGroup | null>(null);
  const [deletingKeyword, setDeletingKeyword] = useState<Keyword | null>(null);

  const canCreate = permissions.includes(PERMISSIONS.FILTERS_CREATE);
  const canUpdate = permissions.includes(PERMISSIONS.FILTERS_UPDATE);
  const canDelete = permissions.includes(PERMISSIONS.FILTERS_DELETE);

  /** Fetch groups for current parent */
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (currentGroupId) params.append("parentId", currentGroupId);

      console.log(
        "[KeywordGroupsBrowser] fetching groups for parentId:",
        currentGroupId
      );

      const res = await fetch(`/api/keyword-groups?${params}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Erreur chargement groupes");

      console.log("[KeywordGroupsBrowser] groups fetched:", data);
      setGroups(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  /** Fetch keywords assigned to the current group */
  /** Fetch keywords assigned to the current group */
  const fetchKeywords = async () => {
    if (!currentGroupId) {
      console.log(
        "[KeywordGroupsBrowser] No currentGroupId, clearing keywords"
      );
      setKeywords([]);
      return;
    }

    try {
      console.log(
        "[KeywordGroupsBrowser] fetching keywords for group:",
        currentGroupId
      );
      const res = await fetch(`/api/keyword-groups/${currentGroupId}/keywords`);

      const data = await res.json(); // ✅ only once
      if (!res.ok) {
        console.error("[KeywordGroupsBrowser] Failed to fetch keywords:", data);
        throw new Error(data?.message || "Erreur chargement mots-clés");
      }

      console.log(
        "[KeywordGroupsBrowser] Keywords fetched successfully:",
        data
      );
      setKeywords(data);
    } catch (err: any) {
      console.error("[KeywordGroupsBrowser] Error fetching keywords:", err);
      setError(err.message || "Erreur chargement mots-clés");
      setKeywords([]);
    }
  };

  /** Fetch breadcrumb path */
  const fetchBreadcrumbs = async () => {
    if (!currentGroupId) return setBreadcrumbs([]);
    try {
      console.log(
        "[KeywordGroupsBrowser] fetching breadcrumbs for:",
        currentGroupId
      );
      const res = await fetch(`/api/keyword-groups/${currentGroupId}/path`);
      if (!res.ok) return;
      const data = await res.json();
      console.log("[KeywordGroupsBrowser] breadcrumbs fetched:", data);
      setBreadcrumbs(data);
    } catch (err) {
      console.error("Erreur chargement breadcrumbs:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchKeywords();
    fetchBreadcrumbs();
  }, [currentGroupId]);

  const handleBackClick = () => {
    if (breadcrumbs.length > 1) {
      onGroupChange(breadcrumbs[breadcrumbs.length - 2].id);
    } else {
      onGroupChange(null);
    }
  };

  const handleDeleteKeyword = async () => {
    if (!deletingKeyword || !currentGroupId) {
      console.warn("[DELETE] Missing deletingKeyword or currentGroupId", {
        deletingKeyword,
        currentGroupId,
      });
      return;
    }

    try {
      console.log("[DELETE] Sending request to remove keyword", {
        groupId: currentGroupId,
        keywordId: deletingKeyword.id,
      });

      const res = await fetch(
        `/api/keyword-groups/${currentGroupId}/keywords/${deletingKeyword.id}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      console.log("[DELETE] Response:", data);

      if (!res.ok)
        throw new Error(data?.message || "Erreur suppression mot-clé");

      setDeletingKeyword(null);
      fetchKeywords();
    } catch (err: any) {
      console.error("[DELETE] Error deleting keyword:", err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des groupes</CardTitle>
          <CardDescription>Chargement des groupes...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loading variant="dots" text="Chargement..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Gestion des groupes</CardTitle>
          <CardDescription>
            Naviguez dans les groupes parent/enfant et mots-clés assignés
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setShowCreateForm(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Nouveau groupe
            </Button>
          )}
          <Button onClick={() => setShowAssignDialog(true)} variant="secondary">
            <Tag className="mr-2 h-4 w-4" />
            Assigner mot-clé
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGroupChange(null)}
            >
              Racine
            </Button>
            <div className="flex items-center gap-1">
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-muted-foreground">/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium">{crumb.name}</span>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onGroupChange(crumb.id)}
                    >
                      {crumb.name}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentGroupId && (
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
            Retour
          </Button>
        )}

        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onGroupChange(group.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate">{group.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {group._count?.keywords || 0} mot
                        {(group._count?.keywords || 0) !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {group._count?.children || 0} enfant
                        {(group._count?.children || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>

                {(canUpdate || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(group);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingGroup(group);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>

        
        {keywords.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" /> Mots-clés
              assignés
            </h3>
            <div className="flex flex-wrap gap-3">
              {keywords.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between px-3 py-2 rounded-full border bg-muted/30 hover:bg-muted transition-all"
                >
                  <span className="font-medium text-sm">{k.name}</span>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant={k.fileCount > 0 ? "default" : "secondary"}>
                      {k.fileCount} {k.fileCount === 1 ? "fichier" : "fichiers"}
                    </Badge>
                    {k.fileCount === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Non utilisé
                      </span>
                    )}
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-1"
                        onClick={() => setDeletingKeyword(k)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 && keywords.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun groupe ou mot-clé trouvé à cet emplacement</p>
          </div>
        )}
      </CardContent>

      <AssignKeywordsDialog
        open={showAssignDialog}
        onOpenChange={(open) => setShowAssignDialog(open)}
        groupId={currentGroupId}
        onSuccess={() => {
          fetchKeywords();
          fetchGroups(); // optional: update counts on groups
        }}
      />

      
      <KeywordGroupForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        parentId={currentGroupId || undefined}
        onSuccess={fetchGroups}
      />

      <KeywordGroupForm
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        group={editingGroup || undefined}
        parentId={currentGroupId || undefined}
        onSuccess={fetchGroups}
      />

      <DeleteDialog
        open={!!deletingGroup}
        title="Supprimer le groupe"
        description={
          deletingGroup
            ? `Voulez-vous vraiment supprimer "${deletingGroup.name}" ? Cette action est irréversible.`
            : undefined
        }
        onClose={() => setDeletingGroup(null)}
        onConfirm={async () => {
          if (!deletingGroup) return;
          try {
            const res = await fetch(`/api/keyword-groups/${deletingGroup.id}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Erreur suppression");
            setDeletingGroup(null);
            fetchGroups();
          } catch (err: any) {
            console.error(err);
            alert(err.message || "Une erreur est survenue");
          }
        }}
      />

      <DeleteDialog
        open={!!deletingKeyword}
        title="Supprimer le mot-clé du groupe"
        description={
          deletingKeyword
            ? `Voulez-vous vraiment supprimer "${deletingKeyword.name}" de ce groupe ?`
            : undefined
        }
        onClose={() => setDeletingKeyword(null)}
        onConfirm={handleDeleteKeyword}
        confirmLabel="Supprimer"
      />
    </Card>
  );
}
