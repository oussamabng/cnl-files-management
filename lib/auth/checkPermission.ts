import { getSessionUser } from './getUserSession';
import { redirect } from 'next/navigation';
import { getUserPermissions } from './getUserPermissions';

export async function checkPermission(required: string | string[]) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  const permissions = getUserPermissions(sessionUser);

  const requiredArray = Array.isArray(required) ? required : [required];

  const isAuthorized = requiredArray.some((perm) =>
    permissions.includes(perm) || permissions.includes('*') // wildcard for superadmin
  );

  if (!isAuthorized) {
    redirect('/unauthorized');
  }

  return sessionUser;
}
