"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Shield, Eye, AlertCircle } from "lucide-react";

import { RoleFormDialog } from "./role-form-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";

import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";
import type { RoleWithPermissions } from "@/types/roles";

import { createRolesColumns } from "@/app/dashboard/roles/columns";
import { DataTable } from "@/components/ui/data-table";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type RolesStats = {
  totalRoles: number;
  assignedUsersCount: number;
  uniquePermissionsCount: number;
};

interface RolesContentProps {
  permissions: PermissionValue[];
}

function RolesTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
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

export function RolesContent({ permissions }: RolesContentProps) {
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canViewRoles = permissions.includes(PERMISSIONS.ROLES_VIEW);
  const canCreateRole = permissions.includes(PERMISSIONS.ROLES_CREATE);

  const isSuperAdmin = (roleName: string | null): boolean =>
    roleName === "SUPERADMIN";

  const {
    data: roles,
    meta,
    stats,
    error,
    pagination,
    sorting,
    isInitialLoading,
    isFetching,
    setPagination,
    setSorting,
    refetch,
  } = useServerDataTable<RoleWithPermissions, RolesStats>({
    endpoint: "/api/roles",
    enabled: canViewRoles,
    initialPageSize: 10,
    initialSorting: [{ id: "name", desc: false }],
  });

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
    refetch();
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  const handleRoleDeleted = () => {
    refetch();
    setIsDeleteOpen(false);
    setSelectedRole(null);
  };

  const columns = useMemo(() => {
    return createRolesColumns({
      permissions,
      isSuperAdmin,
      onEdit: handleEditRole,
      onDelete: handleDeleteRole,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions]);

  if (isInitialLoading) {
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
              Vous n&apos;avez pas les permissions nécessaires pour voir les
              rôles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRoles = stats?.totalRoles ?? meta?.total ?? 0;
  const assignedUsersCount = stats?.assignedUsersCount ?? 0;
  const uniquePermissionsCount = stats?.uniquePermissionsCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {/* <h1 className="text-3xl font-bold tracking-tight">
            Gestion des rôles
          </h1> */}
          <p className="text-muted-foreground">
            Gérez les rôles et leurs permissions pour contrôler l&apos;accès à
            votre application
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateRole && (
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rôle
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 shrink-0 text-blue-600" />
              <p className="text-sm font-medium leading-none text-muted-foreground">
                Total des rôles
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {totalRoles}
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm font-medium leading-none text-muted-foreground">
                Utilisateurs assignés
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {assignedUsersCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 shrink-0 text-purple-600" />
              <p className="text-sm font-medium leading-none text-muted-foreground">
                Permissions uniques
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {uniquePermissionsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des rôles
            <Badge variant="outline" className="ml-auto">
              {totalRoles} rôle{totalRoles !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>
            Visualisez et gérez tous les rôles de votre organisation
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-destructive">{error}</div>
          )}

          {totalRoles === 0 ? (
            <EmptyRolesState
              onCreateRole={handleCreateRole}
              canCreate={canCreateRole}
            />
          ) : (
            <DataTable
              columns={columns}
              data={roles}
              isLoading={isFetching}
              manualPagination
              pageCount={meta?.pageCount ?? 1}
              rowCount={meta?.total}
              pagination={pagination}
              onPaginationChange={setPagination}
              manualSorting
              sorting={sorting}
              onSortingChange={setSorting}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
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
