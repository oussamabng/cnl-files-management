"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Calendar,
  Edit,
  MoreHorizontal,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";
import type { RoleWithPermissions } from "@/types/roles";
import { TruncatedText } from "@/lib/truncation";

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
      {visiblePermissions.map((rp) => (
        <TooltipProvider key={rp.permission.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs cursor-default">
                {rp.permission.description}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{rp.permission.key}</p>
              <p className="text-xs text-muted-foreground">
                {rp.permission.description}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-default">
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">Permissions supplémentaires :</p>
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

function formatDateFR(dateLike: string | Date | null | undefined) {
  if (!dateLike) return null;
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(d.getTime())) return null;

  return {
    date: d.toLocaleDateString("fr-FR"),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function createRolesColumns(opts: {
  permissions: PermissionValue[];
  isSuperAdmin: (roleName: string | null) => boolean;
  onEdit: (role: RoleWithPermissions) => void;
  onDelete: (role: RoleWithPermissions) => void;
}): ColumnDef<RoleWithPermissions>[] {
  const canUpdate = opts.permissions.includes(PERMISSIONS.ROLES_UPDATE);
  const canDelete = opts.permissions.includes(PERMISSIONS.ROLES_DELETE);
  const showActions = canUpdate || canDelete;

  const cols: ColumnDef<RoleWithPermissions>[] = [
    {
      accessorKey: "name",
      header: "Nom du rôle",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{role.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                ID: {role.id}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="min-w-0 max-w-130">
            <TruncatedText
              text={role.description}
              maxLines={2}
              tooltip="auto"
              tooltipTitle="Description"
            />
          </div>
        );
      },
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <PermissionBadges
          rolePermissions={row.original.rolePermissions || []}
        />
      ),
    },
    {
      id: "users",
      header: "Utilisateurs",
      cell: ({ row }) => {
        const count = row.original._count?.userRoles || 0;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {count}
            </Badge>
            {count > 0 && <Users className="h-3 w-3 text-muted-foreground" />}
          </div>
        );
      },
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
        const f = formatDateFR(row.original.createdAt);
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
        const role = row.original;

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
                  onClick={() => opts.onEdit(role)}
                  disabled={!canUpdate}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => opts.onDelete(role)}
                  disabled={opts.isSuperAdmin(role.name) || !canDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                  {(role._count?.userRoles || 0) > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      ({role._count.userRoles} utilisateur
                      {role._count.userRoles > 1 ? "s" : ""})
                    </span>
                  )}
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
