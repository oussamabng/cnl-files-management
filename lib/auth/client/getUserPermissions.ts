import type { UserWithRolesAndPermissions } from "@/types/authorization";
import type { PermissionValue } from "@/lib/constants/permissions";

export function getUserPermissions(user: UserWithRolesAndPermissions): PermissionValue[] {
  const permissionsSet = new Set<PermissionValue>();

  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      permissionsSet.add(rolePermission.permission.key as PermissionValue);
    }
  }

  return Array.from(permissionsSet);
}
