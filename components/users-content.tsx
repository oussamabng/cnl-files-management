"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Plus,
  Trash2,
  Users,
  Shield,
  Mail,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserFormDialog } from "@/components/user-form-dialog";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import type { UserWithRolesAndPermissions } from "@/types/authorization";
import { getUserRoles } from "@/lib/auth/client/getUserRole";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableLoading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RoleWithPermissions } from "@/types/roles";
import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";

type UsersContentProps = {
  permissions: PermissionValue[];
};

export function UsersContent({ permissions }: UsersContentProps) {
  const [users, setUsers] = useState<UserWithRolesAndPermissions[]>([]);
  const [rolesWithPermissions, setRolesWithPermissions] = useState<
    RoleWithPermissions[]
  >([]);
  const [selectedUser, setSelectedUser] =
    useState<UserWithRolesAndPermissions | null>(null);
  const [userToDelete, setUserToDelete] =
    useState<UserWithRolesAndPermissions | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch("/api/users");
      const res = await response.json();
      if (response.ok) {
        setUsers(res.data || []);
      } else {
        setError(res.message || "Impossible de charger les utilisateur");
      }
    } catch (error) {
      setError("Impossible de charger les utilisateurs");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      const data = await response.json();
      if (data.success) {
        setRolesWithPermissions(data.data || []);
      } else {
        setError(data.message || "Impossible de charger les utilisateur");
      }
    } catch (error) {
      setError("Impossible de charger les roles");
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditUser = (user: UserWithRolesAndPermissions) => {
    if (permissions.includes(PERMISSIONS.USERS_UPDATE)) {
      setSelectedUser(user);
      setIsFormOpen(true);
    }
  };

  const handleDeleteUser = (user: UserWithRolesAndPermissions) => {
    if (permissions.includes(PERMISSIONS.USERS_DELETE)) {
      setUserToDelete(user);
      setIsDeleteOpen(true);
    }
  };

  const handleCreateUser = () => {
    if (permissions.includes(PERMISSIONS.USERS_CREATE)) {
      setSelectedUser(null);
      setIsFormOpen(true);
    }
  };

  const handleUserUpdated = () => {
    if (permissions.includes(PERMISSIONS.USERS_UPDATE)) {
      fetchUsers();
      setIsFormOpen(false);
    }
  };

  const handleUserDeleted = () => {
    if (permissions.includes(PERMISSIONS.USERS_DELETE)) {
      fetchUsers();
      setIsDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserRolesBadges = (user: UserWithRolesAndPermissions) => {
    const userRoles = getUserRoles(user);
    if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
      return <Badge variant="secondary">Aucun rôle</Badge>;
    }

    return userRoles.map((role, index) => (
      <Badge key={index} variant="outline" className="mr-1">
        <Shield className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    ));
  };

  const isSuperAdmin = (roleNames: string[]): boolean => {
    return roleNames.includes("SUPERADMIN");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted animate-pulse rounded w-64 mb-2" />
            <div className="h-4 bg-muted animate-pulse rounded w-96" />
          </div>
          <div className="h-10 bg-muted animate-pulse rounded w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <TableLoading rows={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les utilisateurs et leurs rôles dans le système
          </p>
        </div>
        {permissions.includes(PERMISSIONS.USERS_CREATE) && (
          <Button onClick={handleCreateUser} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel Utilisateur
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {permissions.includes(PERMISSIONS.USERS_VIEW) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Utilisateurs actifs dans le système
              </p>
            </CardContent>
          </Card>
        )}
        {permissions.includes(PERMISSIONS.ROLES_VIEW) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rôles Disponibles
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rolesWithPermissions.length}
              </div>
              <p className="text-xs text-muted-foreground">Rôles configurés</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dernière Activité
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Récente</div>
            <p className="text-xs text-muted-foreground">
              Activité utilisateur
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {permissions.includes(PERMISSIONS.USERS_VIEW) && (
        <Card>
          <CardHeader>
            <CardTitle>Liste des Utilisateurs</CardTitle>
            <CardDescription>
              Consultez et gérez tous les utilisateurs du système
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ||
            !permissions.includes(PERMISSIONS.USERS_VIEW) ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  Aucun utilisateur
                </h3>
                {permissions.includes(PERMISSIONS.USERS_CREATE) && (
                  <>
                    <p className="text-muted-foreground">
                      Commencez par créer votre premier utilisateur
                    </p>
                    <Button onClick={handleCreateUser} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un Utilisateur
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead>Date de Création</TableHead>
                    {(permissions.includes(PERMISSIONS.USERS_DELETE) ||
                      permissions.includes(PERMISSIONS.USERS_UPDATE)) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.firstName?.[0]?.toUpperCase()}
                              {user.lastName?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col flex-wrap gap-1">
                          {getUserRolesBadges(user)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? (
                          <div>
                            <p>
                              {new Date(user.createdAt).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(user.createdAt).toLocaleTimeString(
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
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                              className="gap-2"
                              disabled={
                                !permissions.includes(PERMISSIONS.USERS_UPDATE)
                              }
                            >
                              <Edit className="h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="gap-2 text-destructive focus:text-destructive"
                              disabled={
                                !permissions.includes(PERMISSIONS.USERS_DELETE)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <>
        <UserFormDialog
          user={selectedUser}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          availableRoles={rolesWithPermissions}
          onUserUpdated={handleUserUpdated}
        />
        <DeleteUserDialog
          user={userToDelete}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onUserDeleted={handleUserDeleted}
        />
      </>
    </div>
  );
}
