import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  groupPermissions,
  type GroupedPermission,
} from "@/utils/permission-helpers";
import type { PermissionValue } from "@/lib/constants/permissions";

interface PermissionDisplayProps {
  permissions: PermissionValue[];
  maxVisible?: number;
  compact?: boolean;
}

export function PermissionDisplay({
  permissions,
  maxVisible = 3,
  compact = false,
}: PermissionDisplayProps) {
  const groupedPermissions = groupPermissions(permissions);
  const totalPermissions = permissions.length;

  if (totalPermissions === 0) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Aucune permission
      </Badge>
    );
  }

  const visibleGroups = groupedPermissions.slice(0, maxVisible);
  const hiddenCount = Math.max(0, groupedPermissions.length - maxVisible);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {visibleGroups.map((group) => (
          <PermissionGroupBadge
            key={group.group}
            group={group}
            compact={compact}
          />
        ))}

        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-help">
                +{hiddenCount} autres
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">Permissions supplémentaires:</p>
                {groupedPermissions.slice(maxVisible).map((group) => (
                  <div key={group.group} className="flex items-center gap-2">
                    <span className="capitalize">{group.group}</span>
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      {group.permissions
                        .map((perm) => (
                          <span key={perm.value}>
                            {perm.type === "view" ? "Lecture" : "Gestion"}
                          </span>
                        ))
                        .reduce(
                          (prev, curr, index) =>
                            index === 0 ? [curr] : [...prev, ", ", curr],
                          []
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

function PermissionGroupBadge({
  group,
  compact,
}: {
  group: GroupedPermission;
  compact: boolean;
}) {
  const hasView = group.permissions.some((p) => p.type === "view");
  const hasManage = group.permissions.some((p) => p.type === "manage");
  const isSpecial = group.permissions.some((p) => p.type === "special");

  if (isSpecial) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="text-xs">
            {compact ? "Admin" : "Super Admin"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Accès complet à toutes les fonctionnalités</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const permissionTypes = [];
  if (hasView) permissionTypes.push("Lecture");
  if (hasManage) permissionTypes.push("Gestion");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="text-xs">
          {compact
            ? ""
            : group.group.charAt(0).toUpperCase() + group.group.slice(1)}
          {permissionTypes.length > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({permissionTypes.join(", ")})
            </span>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-1">
          <p className="font-medium capitalize">{group.group}</p>
          <div className="space-y-1">
            {group.permissions.map((perm) => (
              <div key={perm.value} className="flex items-center gap-2 text-xs">
                <span>{perm.type === "view" ? "Consultation" : "Gestion"}</span>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
