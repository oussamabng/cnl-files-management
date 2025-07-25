import { Prisma } from "@/lib/generated/prisma";
import { PermissionValue } from "@/lib/constants/permissions";

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: {
      include: {
        permission: true;
      };
    };
    _count: {
      select: {
        userRoles: true;
      };
    };
  };
}> & {
  rolePermissions: {
    roleId: number;
    permissionId: number;
    permission: {
      id: number;
      key: PermissionValue;
      description: string;
    };
  }[];
  _count: {
    userRoles: number;
  };
};
export type RolePermission = Prisma.RolePermissionGetPayload<{
  include: {
    permission: true;
  };
}>;


export type Permission = Prisma.PermissionGetPayload<{}>;
