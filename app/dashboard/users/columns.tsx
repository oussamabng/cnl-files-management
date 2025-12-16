"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Calendar,
  Edit,
  Mail,
  MoreHorizontal,
  Shield,
  Trash2,
} from "lucide-react";

import type { UserWithRolesAndPermissions } from "@/types/authorization";
import { getUserRoles } from "@/lib/auth/client/getUserRole";
import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";

function formatDateFR(dateLike: string | Date | null | undefined) {
  if (!dateLike) return null;
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(d.getTime())) return null;

  return {
    date: d.toLocaleDateString("fr-FR"),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function RolesBadges({ user }: { user: UserWithRolesAndPermissions }) {
  const roles = (getUserRoles(user) || []).filter(Boolean);
  if (!roles.length) return <Badge variant="secondary">Aucun rôle</Badge>;

  return (
    <div className="flex flex-wrap gap-1">
      {roles.slice(0, 3).map((role) => (
        <Badge key={role} variant="outline" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          {role}
        </Badge>
      ))}
      {roles.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{roles.length - 3}
        </Badge>
      )}
    </div>
  );
}

export function createUsersColumns(opts: {
  permissions: PermissionValue[];
  onEdit: (user: UserWithRolesAndPermissions) => void;
  onDelete: (user: UserWithRolesAndPermissions) => void;
}): ColumnDef<UserWithRolesAndPermissions>[] {
  const canUpdate = opts.permissions.includes(PERMISSIONS.USERS_UPDATE);
  const canDelete = opts.permissions.includes(PERMISSIONS.USERS_DELETE);
  const showActions = canUpdate || canDelete;

  const cols: ColumnDef<UserWithRolesAndPermissions>[] = [
    {
      id: "utilisateur",
      header: "Utilisateur",
      cell: ({ row }) => {
        const u = row.original;
        const first = u.firstName?.[0]?.toUpperCase() ?? "";
        const last = u.lastName?.[0]?.toUpperCase() ?? "";
        const initials = (first + last).trim() || "?";

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">
                {u.firstName} {u.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                ID: {u.id}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: "roles",
      header: "Rôles",
      cell: ({ row }) => <RolesBadges user={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Créé le
        </div>
      ),
      cell: ({ row }) => {
        const f = formatDateFR((row.original as any).createdAt);
        if (!f) return <span className="text-muted-foreground">N/A</span>;
        return (
          <div className="text-sm">
            <p>{f.date}</p>
            <p className="text-xs text-muted-foreground">{f.time}</p>
          </div>
        );
      },
    },
  ];

  if (showActions) {
    cols.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const u = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => opts.onEdit(u)}
                  disabled={!canUpdate}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => opts.onDelete(u)}
                  disabled={!canDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  return cols;
}
