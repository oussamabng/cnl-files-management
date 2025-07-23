import { User, Role, Permission } from "@/lib/generated/prisma";
import { Prisma } from "@/lib/generated/prisma";

export type UserWithRole = User & {
  role:
    | (Role & {
        permissions: Permission[];
      })
    | null;
};

export type UserWithRolesAndPermissions = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

