import { RoleWithPermissions } from "@/types/roles";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Shield } from "lucide-react";
import { Badge } from "./ui/badge";

interface RolePermissionsTooltipProps {
  role: RoleWithPermissions;
  children: React.ReactNode;
}

export const RolePermissionsTooltip = ({
  role,
  children,
}: RolePermissionsTooltipProps) => {
  if (!role.rolePermissions || role.rolePermissions.length === 0)
    return <>{children}</>;

  const groupedPermissions = role.rolePermissions.reduce(
    (acc, { permission }) => {
      const category = permission.key.split("_")[0] || "OTHER";
      if (!acc[category]) acc[category] = [];
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const getCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case "files":
        return "Fichiers";
      case "folders":
        return "Dossiers";
      case "users":
        return "Utilisateurs";
      case "roles":
        return "Rôles";
      case "dashboard":
        return "Tableau de bord";
      case "filters":
        return "Filtres";
      case "comments":
        return "Commentaires";
      case "admin":
        return "Administration";
      default:
        return category;
    }
  };

  const getPermissionActionLabel = (key: string) => {
    if (key.includes("VIEW")) return "Voir";
    if (key.includes("CREATE")) return "Créer";
    if (key.includes("UPDATE")) return "Modifier";
    if (key.includes("DELETE")) return "Supprimer";
    if (key.includes("UPLOAD")) return "Télécharger";
    if (key.includes("SUPER_ADMIN")) return "Super Admin";
    return "Accès";
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="w-full">{children}</div>
      </TooltipTrigger>

      <TooltipContent
        side="right"
        sideOffset={8}
        className="z-50 flex max-h-[90vh] max-w-sm flex-col border-0 bg-white p-0 shadow-xl dark:bg-gray-900"
      >
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg">
          <div className="flex shrink-0 items-center gap-3 border-b bg-linear-to-r from-primary/10 to-primary/5 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold text-foreground">
                {role.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {role.rolePermissions.length} permission
                {role.rolePermissions.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-4">
              {Object.entries(groupedPermissions).map(
                ([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 pb-2">
                      <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {getCategoryName(category)}
                      </h5>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="space-y-1.5">
                      {permissions.map((permission) => {
                        const actionLabel = getPermissionActionLabel(
                          permission.key
                        );
                        return (
                          <div
                            key={permission.id}
                            className="flex items-start gap-2.5 rounded-md bg-muted/30 p-2 transition-colors hover:bg-muted/50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-foreground">
                                  {actionLabel}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  sur
                                </span>
                                <span className="truncate text-xs text-foreground">
                                  {getCategoryName(category)}
                                </span>
                              </div>
                              {permission.description && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t bg-muted/20 px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Permissions actives
              </span>
              <Badge variant="secondary" className="text-xs">
                {role.rolePermissions.length}
              </Badge>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
