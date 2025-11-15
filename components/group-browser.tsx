import { PERMISSIONS, PermissionValue } from "@/lib/constants/permissions";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Edit,
  Layers,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Loading } from "./ui/loading";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { GroupForm } from "./group-form";
import { DeleteGroupDialog } from "./delete-group-dialog";
import { ManageDeleteKeywordDialog } from "./manage-delete-keyword-dialog";

interface GroupData {
  id: string;
  name: string;
  parentId: string | null;
  keywords: Array<{ id: string; name: string }>;
  _count: {
    children: number;
    group: number;
    keywords: number;
    files: number;
  };
}
interface KeywordsData {
  id: string;
  name: string;
}

interface GroupBrowserProps {
  permissions: PermissionValue[];
  currentGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
  onGroupSelect?: (groupId: string | null) => void; // For group selection in upload
  selectionMode?: boolean;
}

export function GroupBrowser({
  permissions,
  currentGroupId,
  onGroupChange,
  onGroupSelect,
  selectionMode = false,
}: GroupBrowserProps) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupData | null>(null);
  const [currentKeywords, setCurrentKeywords] = useState<KeywordsData[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(
    null
  );
  const [deleteKeyword, setDeleteKeyword] = useState(false);
  const [currentGroupName, setCurrentGroupName] = useState<string>("");

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (currentGroupId) {
        params.append("parentId", currentGroupId);
      }
      // params.append("includeKeywords", "true");

      const response = await fetch(`/api/groups?${params}`);

      if (response.ok) {
        const data: GroupData[] = await response.json();
        const g = data.find((g) => g.id === currentGroupId);

        setGroups(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Échec du chargement des groupes");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentGroupKeywords = async () => {
    if (!currentGroupId) {
      setCurrentKeywords([]);
      return;
    }

    try {
      const response = await fetch(`/api/groups/${currentGroupId}`);
      if (response.ok) {
        const data = await response.json();

        setCurrentGroupName(data.name);
        setCurrentKeywords(data.keywords || []);
      } else {
        setCurrentKeywords([]);
      }
    } catch (err) {
      console.error("Failed to fetch keywords:", err);
      setCurrentKeywords([]);
    }
  };

  const fetchBreadcrumbs = async () => {
    if (!currentGroupId) {
      setBreadcrumbs([]);
      return;
    }

    try {
      const response = await fetch(`/api/groups/${currentGroupId}/path`);
      if (response.ok) {
        const data = await response.json();
        setBreadcrumbs(data);
      }
    } catch (err) {
      console.error("Failed to fetch breadcrumbs:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchBreadcrumbs();
    if (currentGroupId) {
      fetchCurrentGroupKeywords();
    }
  }, [currentGroupId]);

  const handleGroupClick = (GroupId: string) => {
    if (selectionMode && onGroupSelect) {
      onGroupSelect(GroupId);
    } else {
      onGroupChange(GroupId);
    }
  };

  const handleBackClick = () => {
    if (breadcrumbs.length > 1) {
      const parentGroup = breadcrumbs[breadcrumbs.length - 2];
      onGroupChange(parentGroup.id);
    } else {
      onGroupChange(null);
    }
  };

  const handleSuccess = () => {
    fetchGroups();
    setEditingGroup(null);
    setDeletingGroup(null);
  };

  const handleDeleteClick = (keywordId: string) => {
    setSelectedKeywordId(keywordId);
    setDeleteKeyword(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentGroupId || !selectedKeywordId) return;

    try {
      await fetch(
        `/api/groups/${currentGroupId}/keywords/${selectedKeywordId}`,
        {
          method: "DELETE",
        }
      );

      setCurrentKeywords((prev) =>
        prev.filter((k) => k.id !== selectedKeywordId)
      );
    } finally {
      setDeleteKeyword(false);
      setSelectedKeywordId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Explorateur de groupes</CardTitle>
              <CardDescription>
                Naviguez dans votre structure de groupes
              </CardDescription>
            </div>
            {permissions.includes(PERMISSIONS.GROUPS_CREATE) && (
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau groupe
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
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
            <CardTitle>Explorateur de groupes</CardTitle>
            <CardDescription>
              {selectionMode
                ? "Sélectionnez un groupe pour vos mot-clés"
                : "Naviguez dans votre structure de groupes"}
            </CardDescription>
          </div>
          {permissions.includes(PERMISSIONS.GROUPS_CREATE) &&
            !selectionMode && (
              <Button onClick={() => setShowCreateForm(true)}>
                <div className="relative">
                  <Plus className="h-8 w-8 " />
                </div>{" "}
                Nouveau groupe
              </Button>
            )}
        </div>
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
              onClick={() => onGroupChange(null)}
            >
              Racine
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onGroupChange(crumb.id);
                          }}
                        >
                          {crumb.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {currentGroupId && (
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        )}
        {selectionMode && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Sélection actuelle :{" "}
                  {currentGroupId
                    ? breadcrumbs[breadcrumbs.length - 1]?.name || "Inconnu"
                    : "Dossier racine"}
                </p>
                <p className="text-xs text-blue-600">
                  Les mot-clés seront regroupés dans ce groupe
                </p>
              </div>
              <Button size="sm" onClick={() => onGroupSelect?.(currentGroupId)}>
                Sélectionner ce dossier
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleGroupClick(group.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Layers className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <h4 className="font-medium truncate">{group.name}</h4>
                      {group._count.children !== undefined &&
                        group._count.group > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group._count.group} imbriqué
                            {group._count.group !== 1 ? "s" : ""}
                          </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {group._count.files} fichier
                        {group._count.files !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {group._count.keywords} mot-clé
                        {group._count.keywords !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {group._count.children} dossier
                        {group._count.children !== 1 ? "s" : ""}
                      </Badge>
                      {/* {group._count.children !== undefined &&
                        group._count.group > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group._count.group} imbriqué
                            {group._count.group !== 1 ? "s" : ""}
                          </Badge>
                        )} */}
                    </div>
                  </div>
                </div>
                {!selectionMode &&
                  (permissions.includes(PERMISSIONS.GROUPS_UPDATE) ||
                    permissions.includes(PERMISSIONS.GROUPS_DELETE)) && (
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(group);
                          }}
                          disabled={
                            !permissions.includes(PERMISSIONS.GROUPS_UPDATE)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Renommer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingGroup(group);
                          }}
                          disabled={
                            !permissions.includes(PERMISSIONS.GROUPS_DELETE)
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          </div>
        )}
        {currentGroupId && currentKeywords.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-sm text-gray-500">
              Mots-clés assignés à ce groupe :
            </p>
            <div className="flex flex-wrap gap-1">
              {currentKeywords.map((keyword) => (
                <Badge
                  key={keyword.id}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2 text-sm rounded-md"
                >
                  <span className="truncate max-w-xs">{keyword.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(keyword.id)}
                    className="ml-1 inline-flex items-center justify-center opacity-60 transition-all hover:opacity-100 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    aria-label={`Supprimer ${keyword.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <GroupForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        parentId={currentGroupId}
        onSuccess={handleSuccess}
      />

      <GroupForm
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        group={editingGroup}
        parentId={currentGroupId}
        onSuccess={handleSuccess}
      />

      <DeleteGroupDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
        group={deletingGroup}
        onSuccess={handleSuccess}
      />

      <ManageDeleteKeywordDialog
        open={deleteKeyword}
        groupName={currentGroupName}
        keywordName={
          currentKeywords.find((k) => k.id === selectedKeywordId)?.name ?? ""
        }
        onOpenChange={(open) => !open && setDeleteKeyword(false)}
        onSuccess={handleConfirmDelete}
      />
    </Card>
  );
}
