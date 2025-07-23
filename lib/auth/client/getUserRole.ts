import type { UserWithRolesAndPermissions } from "@/types/authorization";

export function getUserRoles(user: UserWithRolesAndPermissions): string[] {
  const rolesSet = new Set<string>();

  for (const userRole of user.userRoles) {
    rolesSet.add(userRole.role.name);
  }

  return Array.from(rolesSet);
}
