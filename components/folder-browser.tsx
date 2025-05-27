"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FolderForm } from "@/components/folder-form";
import { DeleteFolderDialog } from "@/components/delete-folder-dialog";
import { Loading } from "@/components/ui/loading";

interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  _count: {
    children: number;
    files: number;
    folders?: number; // Add folder count
  };
}

interface FolderBrowserProps {
  role: string;
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  onFolderSelect?: (folderId: string | null) => void; // For folder selection in upload
  selectionMode?: boolean;
}

export function FolderBrowser({
  role,
  currentFolderId,
  onFolderChange,
  onFolderSelect,
  selectionMode = false,
}: FolderBrowserProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Dialog states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderData | null>(null);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (currentFolderId) {
        params.append("parentId", currentFolderId);
      }

      const response = await fetch(`/api/folders?${params}`);

      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Échec du chargement des dossiers");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const fetchBreadcrumbs = async () => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      return;
    }

    try {
      const response = await fetch(`/api/folders/${currentFolderId}/path`);
      if (response.ok) {
        const data = await response.json();
        setBreadcrumbs(data);
      }
    } catch (err) {
      console.error("Failed to fetch breadcrumbs:", err);
    }
  };

  useEffect(() => {
    fetchFolders();
    fetchBreadcrumbs();
  }, [currentFolderId]);

  const handleFolderClick = (folderId: string) => {
    if (selectionMode && onFolderSelect) {
      onFolderSelect(folderId);
    } else {
      onFolderChange(folderId);
    }
  };

  const handleBackClick = () => {
    if (breadcrumbs.length > 1) {
      const parentFolder = breadcrumbs[breadcrumbs.length - 2];
      onFolderChange(parentFolder.id);
    } else {
      onFolderChange(null);
    }
  };

  const handleSuccess = () => {
    fetchFolders();
    setEditingFolder(null);
    setDeletingFolder(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Explorateur de dossiers</CardTitle>
              <CardDescription>
                Naviguez dans votre structure de dossiers
              </CardDescription>
            </div>
            {role === "admin" && (
              <Button disabled>
                <FolderPlus className="mr-2 h-4 w-4" />
                Nouveau dossier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loading variant="dots" text="Chargement des dossiers..." />
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
            <CardTitle>Explorateur de dossiers</CardTitle>
            <CardDescription>
              {selectionMode
                ? "Sélectionnez un dossier pour vos fichiers"
                : "Naviguez dans votre structure de dossiers"}
            </CardDescription>
          </div>
          {role === "admin" && !selectionMode && (
            <Button onClick={() => setShowCreateForm(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Nouveau dossier
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

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFolderChange(null)}
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
                            onFolderChange(crumb.id);
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

        {/* Back Button */}
        {currentFolderId && (
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        )}

        {/* Current Folder Selection */}
        {selectionMode && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Sélection actuelle :{" "}
                  {currentFolderId
                    ? breadcrumbs[breadcrumbs.length - 1]?.name || "Inconnu"
                    : "Dossier racine"}
                </p>
                <p className="text-xs text-blue-600">
                  Les fichiers seront téléchargés à cet emplacement
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onFolderSelect?.(currentFolderId)}
              >
                Sélectionner ce dossier
              </Button>
            </div>
          </div>
        )}

        {/* Folders Grid */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleFolderClick(folder.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Folder className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate">{folder.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {folder._count.files} fichier
                        {folder._count.files !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {folder._count.children} dossier
                        {folder._count.children !== 1 ? "s" : ""}
                      </Badge>
                      {folder._count.folders !== undefined &&
                        folder._count.folders > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{folder._count.folders} imbriqué
                            {folder._count.folders !== 1 ? "s" : ""}
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>

                {role === "admin" && !selectionMode && (
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
                          setEditingFolder(folder);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Renommer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFolder(folder);
                        }}
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

        {folders.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun dossier trouvé à cet emplacement</p>
            {role === "admin" && (
              <p className="text-sm mt-2">
                Créez votre premier dossier pour commencer
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <FolderForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        parentId={currentFolderId}
        onSuccess={handleSuccess}
      />

      <FolderForm
        open={!!editingFolder}
        onOpenChange={(open) => !open && setEditingFolder(null)}
        folder={editingFolder}
        parentId={currentFolderId}
        onSuccess={handleSuccess}
      />

      <DeleteFolderDialog
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
        folder={deletingFolder}
        onSuccess={handleSuccess}
      />
    </Card>
  );
}
