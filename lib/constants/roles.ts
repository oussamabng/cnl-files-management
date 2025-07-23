// lib/constants/permissions.ts

export const ROLES = {
  SUPERADMIN: "Super admin",
} as const;

export type Role = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[Role];
