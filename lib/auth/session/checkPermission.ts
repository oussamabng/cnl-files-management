import { PermissionValue } from '@/lib/constants/permissions';
import { getSessionUser } from './getUserSession';
import { redirect } from 'next/navigation';
import { UserWithRolesAndPermissions } from '@/types/authorization';
import { getUserPermissions } from '../client/getUserPermissions';

export async function checkPermission(required: PermissionValue | PermissionValue[]): Promise<UserWithRolesAndPermissions> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  const permissions = await getUserPermissions(sessionUser);

  const requiredArray = Array.isArray(required) ? required : [required];

  const isAuthorized = requiredArray.some((perm) =>
    permissions.includes(perm) || permissions.includes('*') // wildcard for superadmin
  );

  if (!isAuthorized) {
    redirect('/unauthorized');
  }

  return sessionUser;
}
