export const ROLES = {
  SUPERADMIN: "Super admin",
  REGULARUSER: "Utilisateur",
} as const;

export type Role = keyof typeof ROLES;
export type RoleValue = (typeof ROLES)[Role];
