"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  Calendar,
  MoreHorizontal,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoleFormDialog } from "./role-form-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";
import type { RoleWithPermissions } from "@/types/roles";

interface RolesContentProps {
  permissions: PermissionValue[];
}

function RolesTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-18" />
          </div>
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2 ml-auto">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRolesState({
  onCreateRole,
  canCreate,
}: {
  onCreateRole: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Shield className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Aucun rôle configuré</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Commencez par créer votre premier rôle pour organiser les permissions de
        votre équipe
      </p>
      {canCreate && (
        <Button onClick={onCreateRole} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Créer le premier rôle
        </Button>
      )}
    </div>
  );
}

function PermissionBadges({
  rolePermissions,
}: {
  rolePermissions: RoleWithPermissions["rolePermissions"];
}) {
  const maxVisible = 3;
  const visiblePermissions = rolePermissions.slice(0, maxVisible);
  const remainingCount = Math.max(0, rolePermissions.length - maxVisible);

  if (rolePermissions.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Aucune permission
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visiblePermissions.map((rolePermission) => (
        <TooltipProvider key={rolePermission.permission.id}>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs">
                {rolePermission.permission.description}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{rolePermission.permission.key}</p>
              <p className="text-xs text-muted-foreground">
                {rolePermission.permission.description}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs">
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">Permissions supplémentaires:</p>
                {rolePermissions.slice(maxVisible).map((rp) => (
                  <p key={rp.permission.id} className="text-xs">
                    • {rp.permission.description}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export function RolesContent({ permissions }: RolesContentProps) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canViewRoles = permissions.includes(PERMISSIONS.ROLES_VIEW);

  useEffect(() => {
    const canView = permissions.includes(PERMISSIONS.ROLES_VIEW);
    if (canView) {
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [permissions]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/roles");
      if (response.ok) {
        const res = await response.json();
        console.log(res.data);
        setRoles(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log(roles);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDeleteRole = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleRoleUpdated = () => {
    fetchRoles();
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  const handleRoleDeleted = () => {
    fetchRoles();
    setIsDeleteOpen(false);
    setSelectedRole(null);
  };

  const isSuperAdmin = (roleName: string | null): boolean => {
    return roleName === "SUPERADMIN";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <RolesTableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewRoles) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Accès non autorisé</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour voir les rôles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des rôles
          </h1>
          <p className="text-muted-foreground">
            Gérez les rôles et leurs permissions pour contrôler l'accès à votre
            application
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permissions.includes(PERMISSIONS.ROLES_CREATE) && (
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rôle
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total des rôles
                </p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Utilisateurs assignés
                </p>
                <p className="text-2xl font-bold">
                  {roles.reduce(
                    (sum, role) => sum + (role._count.userRoles || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Permissions uniques
                </p>
                <p className="text-2xl font-bold">
                  {
                    new Set(
                      roles.flatMap(
                        (role) =>
                          role.rolePermissions?.map((rp) => rp.permission.id) ||
                          []
                      )
                    ).size
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des rôles
            <Badge variant="outline" className="ml-auto">
              {roles.length} rôle{roles.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>
            Visualisez et gérez tous les rôles de votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <EmptyRolesState
              onCreateRole={handleCreateRole}
              canCreate={permissions.includes(PERMISSIONS.ROLES_CREATE)}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Nom du rôle</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Permissions</TableHead>
                    <TableHead className="font-semibold">
                      Utilisateurs
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Créé le
                      </div>
                    </TableHead>
                    {permissions.includes(
                      PERMISSIONS.ROLES_UPDATE || PERMISSIONS.ROLES_DELETE
                    ) && (
                      <TableHead className="text-right font-semibold">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {role.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {role.description || (
                            <span className="text-muted-foreground italic">
                              Aucune description
                            </span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <PermissionBadges
                          rolePermissions={role.rolePermissions || []}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {role._count.userRoles || 0}
                          </Badge>
                          {(role._count.userRoles || 0) > 0 && (
                            <Users className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {role.createdAt ? (
                            <div>
                              <p>
                                {new Date(role.createdAt).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(role.createdAt).toLocaleTimeString(
                                  "fr-FR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      {permissions.includes(
                        PERMISSIONS.ROLES_UPDATE || PERMISSIONS.ROLES_DELETE
                      ) && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>{" "}
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleEditRole(role)}
                                disabled={
                                  !permissions.includes(
                                    PERMISSIONS.ROLES_UPDATE
                                  )
                                }
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteRole(role)}
                                disabled={
                                  isSuperAdmin(role.name) ||
                                  !permissions.includes(
                                    PERMISSIONS.ROLES_DELETE
                                  )
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                                {(role._count.userRoles || 0) > 0 && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    ({role._count.userRoles} utilisateur
                                    {(role._count.userRoles || 0) > 1
                                      ? "s"
                                      : ""}
                                    )
                                  </span>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleFormDialog
        role={selectedRole}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onRoleUpdated={handleRoleUpdated}
      />
      {selectedRole && (
        <DeleteRoleDialog
          role={selectedRole}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onRoleDeleted={handleRoleDeleted}
        />
      )}
    </div>
  );
}
