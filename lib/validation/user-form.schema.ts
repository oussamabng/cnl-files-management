import * as z from "zod";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { RoleWithPermissions } from "@/types/roles";

export function buildUserFormSchema(
  user: boolean,
  availableRoles: RoleWithPermissions[]
) {
  return z
    .object({
      firstName: z.string().min(1, "Le prénom est requis"),
      lastName: z.string().min(1, "Le nom est requis"),
      email: z.string().email("Email invalide"),

      password: user
        ? z
            .string()
            .min(4, "Le mot de passe doit contenir au moins 4 caractères")
            .or(z.literal(""))
        : z
            .string()
            .min(4, "Le mot de passe doit contenir au moins 4 caractères")
            .regex(/[A-Z]/, "Une majuscule est requise"),

      confirmPassword: user
        ? z.string().optional()
        : z.string().min(1, "Veuillez confirmer le mot de passe"),

      roleIds: z
        .array(z.string())
        .min(1, "Au moins un rôle doit être sélectionné"),
    })
    .refine(
      (data) =>
        !data.password ||
        data.password.length === 0 ||
        data.password === data.confirmPassword,
      {
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas",
      }
    )
    .refine(
      (data) => {
        const roles = availableRoles.filter((r) =>
          data.roleIds.includes(r.id.toString())
        );

        const permissions = new Set<string>();
        roles.forEach((r) =>
          r.rolePermissions?.forEach((p) => permissions.add(p.permission.key))
        );

        const needsView = [
          PERMISSIONS.ROLES_CREATE,
          PERMISSIONS.ROLES_UPDATE,
          PERMISSIONS.ROLES_DELETE,
        ].some((p) => permissions.has(p));

        return !needsView || permissions.has(PERMISSIONS.ROLES_VIEW);
      },
      {
        path: ["roleIds"],
        message:
          "Créer / modifier / supprimer des rôles nécessite la permission « Voir les rôles »",
      }
    );
}
