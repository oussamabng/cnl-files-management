"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
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

interface KeywordGroup {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  children?: KeywordGroup[];
  keywords?: { id: string; name: string }[];
  _count?: { keywords: number; children: number };
}

interface KeywordGroupsBrowserProps {
  permissions: PermissionValue[];
}

export function KeywordGroupsBrowser({
  permissions,
}: KeywordGroupsBrowserProps) {
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Dialog states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KeywordGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<KeywordGroup | null>(null);

  const canCreate = permissions.includes(PERMISSIONS.FILTERS_CREATE);
  const canUpdate = permissions.includes(PERMISSIONS.FILTERS_UPDATE);
  const canDelete = permissions.includes(PERMISSIONS.FILTERS_DELETE);

  /** Fetch groups for current level */
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (currentGroupId) params.append("parentId", currentGroupId);
      const res = await fetch(`/api/keyword-groups?${params}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Erreur de chargement des groupes");
      setGroups(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  /** Fetch breadcrumb path */
  const fetchBreadcrumbs = async () => {
    if (!currentGroupId) return setBreadcrumbs([]);
    try {
      const res = await fetch(`/api/keyword-groups/${currentGroupId}/path`);
      if (!res.ok) return;
      const data = await res.json();
      setBreadcrumbs(data);
    } catch (err) {
      console.error("Failed to fetch breadcrumbs:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchBreadcrumbs();
  }, [currentGroupId]);

  /** Navigate back to parent */
  const handleBackClick = () => {
    if (breadcrumbs.length > 1) {
      setCurrentGroupId(breadcrumbs[breadcrumbs.length - 2].id);
    } else {
      setCurrentGroupId(null);
    }
  };

  /** Delete callback */
  const handleDeleteSuccess = () => {
    setDeletingGroup(null);
    fetchGroups();
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
            Naviguez dans les groupes parent/enfant
          </CardDescription>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateForm(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouveau groupe
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
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
              onClick={() => setCurrentGroupId(null)}
            >
              Racine
            </Button>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium">{crumb.name}</span>
                ) : (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setCurrentGroupId(crumb.id)}
                  >
                    {crumb.name}
                  </Button>
                )}
              </span>
            ))}
          </div>
        )}

        
        {currentGroupId && (
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        )}

        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setCurrentGroupId(group.id)}
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
                        onClick={(e) => e.stopPropagation()} // prevent parent click
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

        {groups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun groupe trouvé à cet emplacement</p>
            {canCreate && (
              <p className="text-sm mt-2">Créez votre premier groupe</p>
            )}
          </div>
        )}
      </CardContent>

      
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
            handleDeleteSuccess();
          } catch (err: any) {
            console.error(err);
            alert(err.message || "Une erreur est survenue");
          }
        }}
      />
    </Card>
  );
}
