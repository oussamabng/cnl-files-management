import { PermissionValue } from "@/lib/constants/permissions";
import { getSessionUser } from "./getUserSession";
import { getUserPermissions } from "../client/getUserPermissions";
import { UserWithRolesAndPermissions } from "@/types/authorization";

type RequireApiPermissionResult = {
  user?: UserWithRolesAndPermissions;
  error?: string;
  message?: string;
  status: number;
  success: boolean;
};

export async function requireApiPermission(
  required: PermissionValue | PermissionValue[],
  mode: "or" | "and" = "or"
): Promise<RequireApiPermissionResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      error: "Unauthorized",
      message: "Vous devez être connecté pour accéder à cette ressource.",
      status: 401,
      success: false,
    };
  }

  const permissions = getUserPermissions(user);
  const requiredArray = Array.isArray(required) ? required : [required];

  const isAuthorized =
    mode === "or"
      ? requiredArray.some(
          (perm) => permissions.includes(perm)
        )
      : requiredArray.every(
          (perm) => permissions.includes(perm)
        );

  if (!isAuthorized) {
    return {
      error: "Forbidden",
      message: "Vous n'avez pas la permission d'accéder à cette ressource.",
      status: 403,
      success: false,
    };
  }

  return {
    user,
    message: "Permission accordée.",
    status: 200,
    success: true,
  };
}
