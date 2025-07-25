"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  type PermissionValue,
} from "@/lib/constants/permissions";
import type { Permission, RoleWithPermissions } from "@/types/roles";

interface RoleFormDialogProps {
  role: RoleWithPermissions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleUpdated: () => void;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[]; // Permission keys
}

const AVAILABLE_PERMISSIONS: { id: string; name: string; category: string }[] =
  Object.entries(PERMISSION_GROUPS).flatMap(([categoryKey, perms]) => {
    const categoryNameMap: Record<string, string> = {
      files: "Fichiers",
      folders: "Dossiers",
      filters: "Filtres",
      comments: "Commentaires",
      roles: "Rôles",
      users: "Utilisateurs",
      dashboard: "Tableau de bord",
      admin: "Administration",
    };
    return perms.map((perm) => ({
      id: perm,
      name: getPermissionLabel(perm as PermissionValue),
      category: categoryNameMap[categoryKey] || categoryKey,
    }));
  });

function getPermissionLabel(permission: string): string {
  switch (permission as PermissionValue) {
    case PERMISSIONS.DASHBOARD_VIEW:
      return "Voir le tableau de bord";
    case PERMISSIONS.FILES_VIEW:
      return "Voir les fichiers";
    case PERMISSIONS.FILES_UPDATE:
      return "Modifier les fichiers";
    case PERMISSIONS.FILES_UPLOAD:
      return "Télécharger les fichiers";
    case PERMISSIONS.FILES_DELETE:
      return "Supprimer les fichiers";
    case PERMISSIONS.FOLDERS_VIEW:
      return "Voir les dossiers";
    case PERMISSIONS.FOLDERS_CREATE:
      return "Créer les dossiers";
    case PERMISSIONS.FOLDERS_UPDATE:
      return "Modifier les dossiers";
    case PERMISSIONS.FOLDERS_DELETE:
      return "Supprimer les dossiers";
    case PERMISSIONS.FILTERS_VIEW:
      return "Voir les filtres";
    case PERMISSIONS.FILTERS_CREATE:
      return "Créer les filtres";
    case PERMISSIONS.FILTERS_UPDATE:
      return "Modifier les filtres";
    case PERMISSIONS.FILTERS_DELETE:
      return "Supprimer les filtres";
    case PERMISSIONS.COMMENTS_VIEW:
      return "Voir les commentaires";
    case PERMISSIONS.COMMENTS_CREATE:
      return "Créer les commentaires";
    case PERMISSIONS.COMMENTS_UPDATE:
      return "Modifier les commentaires";
    case PERMISSIONS.COMMENTS_DELETE:
      return "Supprimer les commentaires";
    case PERMISSIONS.ROLES_VIEW:
      return "Voir les rôles";
    case PERMISSIONS.ROLES_CREATE:
      return "Créer les rôles";
    case PERMISSIONS.ROLES_UPDATE:
      return "Modifier les rôles";
    case PERMISSIONS.ROLES_DELETE:
      return "Supprimer les rôles";
    case PERMISSIONS.USERS_VIEW:
      return "Voir les utilisateurs";
    case PERMISSIONS.USERS_CREATE:
      return "Créer les utilisateurs";
    case PERMISSIONS.USERS_UPDATE:
      return "Modifier les utilisateurs";
    case PERMISSIONS.USERS_DELETE:
      return "Supprimer les utilisateurs";
    case PERMISSIONS.SUPER_ADMIN:
      return "Super Admin";
    default:
      return permission;
  }
}

export function RoleFormDialog({
  role,
  open,
  onOpenChange,
  onRoleUpdated,
}: RoleFormDialogProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [fetchingAllPermissions, setFetchingAllPermissions] = useState(true);

  const isEditing = !!role;

  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const response = await fetch("/api/permissions");
        if (response.ok) {
          const { data } = await response.json();
          setAllPermissions(data);
        } else {
          console.error(
            "Failed to fetch all permissions:",
            await response.json()
          );
          setError("Failed to load all permissions.");
        }
      } catch (err) {
        console.error("Error fetching all permissions:", err);
        setError("Error connecting to server to load permissions.");
      } finally {
        setFetchingAllPermissions(false);
      }
    };
    fetchAllPermissions();
  }, []);

  // Create a map for quick lookup of permission IDs by key
  const permissionKeyToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    allPermissions.forEach((p) => map.set(p.key, p.id));
    return map;
  }, [allPermissions]);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        permissions: role.rolePermissions.map((rp) => rp.permission.key),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        permissions: [],
      });
    }
    setError(null);
  }, [role, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const permissionIds = formData.permissions
        .map((key) => permissionKeyToIdMap.get(key))
        .filter((id): id is number => id !== undefined); // Filter out undefined (for keys not found)

      const requestBody = {
        name: formData.name,
        description: formData.description,
        permissionIds: permissionIds,
      };

      let response: Response;
      if (isEditing) {
        // Update existing role
        console.log("Sending PUT request:", requestBody);
        response = await fetch(`/api/roles/${role!.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Create new role
        console.log("Sending POST request:", requestBody);
        response = await fetch("/api/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }

      const result = await response.json();
      console.log("API Response:", result);

      if (response.ok) {
        onRoleUpdated();
        onOpenChange(false);
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Error submitting role:", error);
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter((p) => p !== permissionId),
    }));
  };

  const handleSelectAllGroup = (category: string, checked: boolean) => {
    setFormData((prev) => {
      const permissionsInGroup = AVAILABLE_PERMISSIONS.filter(
        (p) => p.category === category
      ).map((p) => p.id);

      const newPermissions = new Set(prev.permissions);

      if (checked) {
        permissionsInGroup.forEach((permId) => newPermissions.add(permId));
      } else {
        permissionsInGroup.forEach((permId) => newPermissions.delete(permId));
      }

      return {
        ...prev,
        permissions: Array.from(newPermissions),
      };
    });
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le rôle" : "Créer un nouveau rôle"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du rôle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Administrateur, Éditeur..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description du rôle et de ses responsabilités"
                rows={3}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              {fetchingAllPermissions ? (
                <div className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement des
                  permissions...
                </div>
              ) : (
                <div className="space-y-4 mt-2 p-4 border rounded-md bg-muted/20">
                  {Object.entries(groupedPermissions).map(
                    ([category, permissions]) => {
                      const selectedPermissionsInGroup =
                        formData.permissions.filter((permId) =>
                          permissions.some((p) => p.id === permId)
                        );
                      const isGroupChecked =
                        selectedPermissionsInGroup.length ===
                        permissions.length;
                      const isGroupIndeterminate =
                        selectedPermissionsInGroup.length > 0 &&
                        selectedPermissionsInGroup.length < permissions.length;

                      return (
                        <Card key={category}>
                          <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                              {category}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`select-all-${category}`}
                                checked={
                                  isGroupIndeterminate
                                    ? "indeterminate"
                                    : isGroupChecked
                                }
                                onCheckedChange={(checked) =>
                                  handleSelectAllGroup(category, !!checked)
                                }
                              />
                              <Label
                                htmlFor={`select-all-${category}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                Tout sélectionner
                              </Label>
                            </div>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={permission.id}
                                  checked={formData.permissions.includes(
                                    permission.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(
                                      permission.id,
                                      !!checked
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={permission.id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {permission.name}
                                </Label>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    }
                  )}
                </div>
              )}
            </div>
            {formData.permissions.length > 0 && (
              <div>
                <Label>Permissions sélectionnées</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.permissions.map((permissionId) => {
                    const permission = AVAILABLE_PERMISSIONS.find(
                      (p) => p.id === permissionId
                    );
                    return (
                      <Badge key={permissionId} variant="secondary">
                        {permission?.name || permissionId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !formData.name.trim() || fetchingAllPermissions
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Enregistrement...
                </>
              ) : isEditing ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
