import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  PERMISSION_DEPENDENCIES,
  PermissionValue,
} from "@/lib/constants/permissions";
import { error } from "console";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserName({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}): string {
  if (!firstName && !lastName) {
    return "Anonymous User";
  }

  if (!firstName) {
    return lastName!;
  }

  if (!lastName) {
    return firstName;
  }

  return `${firstName} ${lastName}`;
}

export interface PermissionValidationResult {
  success: boolean;
  errors: string[];
}

export const getValidationErrorMessage = (
  missingDependencies: Record<PermissionValue, PermissionValue[]>
): string => {
  const permissionLabels: Record<PermissionValue, string> = {
    DASHBOARD_VIEW: "Voir le tableau de bord",
    FILES_VIEW: "Voir les fichiers",
    FILES_UPDATE: "Modifier les fichiers",
    FILES_UPLOAD: "Chargement des fichiers",
    FILES_DELETE: "Supprimer les fichiers",
    FOLDERS_VIEW: "Voir les dossiers",
    FOLDERS_CREATE: "Créer les dossiers",
    FOLDERS_UPDATE: "Modifier les dossiers",
    FOLDERS_DELETE: "Supprimer les dossiers",
    FILTERS_VIEW: "Voir les filtres",
    FILTERS_CREATE: "Créer les filtres",
    FILTERS_UPDATE: "Modifier les filtres",
    FILTERS_DELETE: "Supprimer les filtres",
    ROLES_VIEW: "Voir les rôles",
    ROLES_CREATE: "Créer les rôles",
    ROLES_UPDATE: "Modifier les rôles",
    ROLES_DELETE: "Supprimer les rôles",
    USERS_VIEW: "Voir les utilisateurs",
    USERS_CREATE: "Créer les utilisateurs",
    USERS_UPDATE: "Modifier les utilisateurs",
    USERS_DELETE: "Supprimer les utilisateurs",
    "*": "Super Admin",
  };

  const errorLines = Object.entries(missingDependencies).map(
    ([permission, missing]) => {
      const permLabel =
        permissionLabels[permission as PermissionValue] ?? permission;
      const missingLabels = missing.map((m) => permissionLabels[m] ?? m);
      return `La permission "${permLabel}" requiert : ${missingLabels.join(
        ", "
      )}`;
    }
  );

  return errorLines.join(" | ");
};

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
