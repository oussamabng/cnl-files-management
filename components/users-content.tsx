"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Shield, Users } from "lucide-react";

import type { UserWithRolesAndPermissions } from "@/types/authorization";
import type { RoleWithPermissions } from "@/types/roles";
import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";

import { DataTable } from "@/components/ui/data-table";
import { createUsersColumns } from "@/app/dashboard/users/columns";

import { UserFormDialog } from "@/components/user-form-dialog";
import { DeleteUserDialog } from "@/components/delete-user-dialog";

import { useServerDataTable } from "@/hooks/use-server-data-table";
import { TableFiltresBar } from "@/components/table-filtres-bar";
import { SelectOption } from "./ui/form-field";

type UsersStats = {
  totalUsers: number;
};

type RolesMeta = {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

type UsersFiltresForm = {
  q: string;
  roleIds: string[];
};

type UsersContentProps = {
  permissions: PermissionValue[];
};

export function UsersContent({ permissions }: UsersContentProps) {
  const [selectedUser, setSelectedUser] =
    useState<UserWithRolesAndPermissions | null>(null);
  const [userToDelete, setUserToDelete] =
    useState<UserWithRolesAndPermissions | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [rolesOptions, setRolesOptions] = useState<SelectOption[]>([]);
  const [rolesTotal, setRolesTotal] = useState<number>(0);

  const [applied, setApplied] = useState<{
    q: string;
    roleIds: string[];
  } | null>(null);

  const canViewUsers = permissions.includes(PERMISSIONS.USERS_VIEW);
  const canCreateUser = permissions.includes(PERMISSIONS.USERS_CREATE);
  const canViewRoles = permissions.includes(PERMISSIONS.ROLES_VIEW);

  const form = useForm<UsersFiltresForm>({
    defaultValues: { q: "", roleIds: [] },
    mode: "onSubmit",
  });

  const query = useMemo(() => {
    if (!applied) return {};
    const q = applied.q.trim();
    return {
      q: q.length ? q : undefined,
      roleIds: applied.roleIds.length ? applied.roleIds : undefined,
    };
  }, [applied]);

  const {
    data: users,
    meta,
    stats,
    error,
    pagination,
    sorting,
    isInitialLoading,
    isFetching,
    setPagination,
    setSorting,
    setPageIndex,
    refetch,
  } = useServerDataTable<UserWithRolesAndPermissions, UsersStats>({
    endpoint: "/api/users",
    enabled: canViewUsers,
    initialPageSize: 10,
    initialSorting: [{ id: "createdAt", desc: true }],
    query,
  });

  const showReset = !!(
    applied &&
    (applied.q.trim().length || applied.roleIds.length)
  );

  const [rolesForDialog, setRolesForDialog] = useState<RoleWithPermissions[]>(
    []
  );

  useEffect(() => {
    if (!canViewRoles) return;

    const ac = new AbortController();

    (async () => {
      const res = await fetch(
        "/api/roles?pageIndex=0&pageSize=100&sortBy=name&sortDir=asc",
        { signal: ac.signal }
      );
      const json = await res.json();
      if (!res.ok || json.success === false) return;

      const roles = (json.data || []) as RoleWithPermissions[];

      setRolesForDialog(roles);
      setRolesOptions(
        roles.map((r) => ({ value: String(r.id), label: r.name }))
      );
    })();

    return () => ac.abort();
  }, [canViewRoles]);

  useEffect(() => {
    if (!canViewRoles) return;

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          "/api/roles?pageIndex=0&pageSize=10&sortBy=name&sortDir=asc",
          {
            signal: ac.signal,
          }
        );
        const json = await res.json();
        if (!res.ok || json.success === false) return;

        const roles = (json.data || []) as RoleWithPermissions[];
        const meta = (json.meta || {}) as Partial<RolesMeta>;

        setRolesOptions(
          roles.map((r) => ({
            value: String(r.id),
            label: r.name,
          }))
        );
        setRolesTotal(
          typeof meta.total === "number" ? meta.total : roles.length
        );
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
      }
    })();

    return () => ac.abort();
  }, [canViewRoles]);

  const handleCreateUser = () => {
    if (!canCreateUser) return;
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: UserWithRolesAndPermissions) => {
    if (!permissions.includes(PERMISSIONS.USERS_UPDATE)) return;
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: UserWithRolesAndPermissions) => {
    if (!permissions.includes(PERMISSIONS.USERS_DELETE)) return;
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const handleUserUpdated = () => {
    refetch();
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleUserDeleted = () => {
    refetch();
    setIsDeleteOpen(false);
    setUserToDelete(null);
  };

  const columns = useMemo(() => {
    return createUsersColumns({
      permissions,
      onEdit: handleEditUser,
      onDelete: handleDeleteUser,
    });
  }, [permissions]);

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewUsers) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Accès non autorisé</h3>
            <p className="text-muted-foreground">
              Vous n&apos;avez pas les permissions nécessaires pour voir les
              utilisateurs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUsers = stats?.totalUsers ?? meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs rôles dans le système
          </p>
        </div>

        {canCreateUser && (
          <Button onClick={handleCreateUser} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des utilisateurs
            <Badge variant="outline" className="ml-auto">
              {meta?.total ?? 0} utilisateur
              {(meta?.total ?? 0) !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <CardDescription>
            Consultez et gérez tous les utilisateurs du système
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <TableFiltresBar
            form={form}
            search={{
              name: "q",
              label: "Recherche",
              placeholder: "Nom, prénom ou email",
            }}
            multiSelect={
              canViewRoles
                ? {
                    name: "roleIds",
                    label: "Rôles",
                    placeholder: "Sélectionner des rôles",
                    options: rolesOptions,
                  }
                : undefined
            }
            showReset={showReset}
            onApply={(values) => {
              setApplied({
                q: values.q ?? "",
                roleIds: Array.isArray(values.roleIds) ? values.roleIds : [],
              });
              setPageIndex(0);
            }}
            onReset={() => {
              form.reset({ q: "", roleIds: [] });
              setApplied(null);
              setPageIndex(0);
            }}
          />

          {meta?.total === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Aucun utilisateur</h3>
              <p className="text-muted-foreground">
                Aucun résultat ne correspond aux filtres appliqués
              </p>
              {canCreateUser && (
                <Button onClick={handleCreateUser} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un utilisateur
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
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

      <UserFormDialog
        user={selectedUser}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        availableRoles={rolesForDialog}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserDialog
        user={userToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
}
