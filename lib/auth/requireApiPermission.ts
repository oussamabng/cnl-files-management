import { getSessionUser } from "./getUserSession";
import { getUserPermissions } from "./getUserPermissions";

export async function requireApiPermission(required: string | string[]) {
  const user = await getSessionUser();
  if (!user) {
    return { error: new Response("Unauthorized", { status: 401 }), user: null };
  }

  const permissions = getUserPermissions(user);
  const requiredArray = Array.isArray(required) ? required : [required];

  const isAuthorized = requiredArray.some((perm) =>
    permissions.includes(perm) || permissions.includes("*")
  );

  if (!isAuthorized) {
    return { error: new Response("Forbidden", { status: 403 }), user };
  }

  return { error: null, user };
}
