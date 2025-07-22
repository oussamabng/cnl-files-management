// lib/auth/permissions.ts
import type { UserWithRole } from "@/types/authorization";
import { PERMISSIONS, type PermissionValue } from "@/lib/constants/permissions";

/**
 * Checks if the user has a specific permission.
 * @param user - The authenticated user object, including role and permissions.
 * @param permission - The permission to check against the user's role.
 * @returns True if the user has the permission or is a SuperAdmin.
 */
export function hasPermission(
  user: UserWithRole | null | undefined,
  permission: PermissionValue
): boolean {
  if (!user?.role?.permissions) return false;

  const userPermissions = user.role.permissions.map((p) => p.key);

  return (
    userPermissions.includes(PERMISSIONS.SUPER_ADMIN) ||
    userPermissions.includes(permission)
  );
}
