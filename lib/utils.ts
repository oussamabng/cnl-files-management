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

interface PasswordStrength {
  score: number;
  label: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  if (requirements.length) score += 2;
  if (requirements.uppercase) score += 2;
  if (requirements.lowercase) score += 1;
  if (requirements.number) score += 1;
  if (requirements.special) score += 1;

  const normalizedScore = Math.min(5, score);

  let label = "";
  switch (normalizedScore) {
    case 0:
    case 1:
      label = "Très faible";
      break;
    case 2:
      label = "Faible";
      break;
    case 3:
      label = "Moyen";
      break;
    case 4:
      label = "Fort";
      break;
    case 5:
      label = "Très fort";
      break;
  }

  return { score: normalizedScore, label, requirements };
}

export function generatePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = '!@#$%^&*(),.?":{}|<>';
  const allChars = lowercase + uppercase + numbers + special;

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  for (let i = 1; i < 12; i++)
    password += allChars[Math.floor(Math.random() * allChars.length)];

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

export function generateSecurePassword(length = 14): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";

  let password = "";
  const cryptoObj = window.crypto || (window as any).msCrypto;
  const randomValues = new Uint32Array(length);
  cryptoObj.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}
