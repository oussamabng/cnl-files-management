import type { UserWithRolesAndPermissions } from "@/types/authorization";

export function getUserPermissions(user: UserWithRolesAndPermissions): string[] {
  const permissionsSet = new Set<string>();

  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      permissionsSet.add(rolePermission.permission.key);
    }
  }

  return Array.from(permissionsSet);
}
