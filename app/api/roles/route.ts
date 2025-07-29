import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PERMISSION_DEPENDENCIES,
  PERMISSIONS,
  PermissionValue,
} from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { getValidationErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const response = await requireApiPermission([
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.USERS_CREATE,
    ]);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const roles = await prisma.role.findMany({
      where: {
        name: {
          not: "SUPERADMIN",
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = roles.map((role) => ({
      ...role,
      userCount: role._count.userRoles,
    }));
    return NextResponse.json({ status: 200, data: result, success: true });
  } catch (err) {
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.ROLES_CREATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }
    const body = await req.json();
    const { name, description, permissionIds } = body;

    if (!name || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Entrée invalide. 'name' et 'permissionIds' sont requis." },
        { status: 400 }
      );
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { message: `Le rôle "${name}" existe déjà.` },
        { status: 409 }
      );
    }

    const matchedPermissions = await prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
      select: {
        id: true,
        key: true,
      },
    });

    if (matchedPermissions.length !== permissionIds.length) {
      const invalidKeys = permissionIds.filter(
        (key: string) => !matchedPermissions.find((p) => p.key === key)
      );
      return NextResponse.json(
        {
          message: `Clé(s) de permission invalide(s) : ${invalidKeys.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const permissionsKeys: PermissionValue[] = matchedPermissions.map(
      (p) => p.key as PermissionValue
    );

    const missingDependencies: Record<PermissionValue, PermissionValue[]> = {};

    permissionsKeys.forEach((permissionId) => {
      const requiredPermissions = PERMISSION_DEPENDENCIES[permissionId];
      if (!requiredPermissions || requiredPermissions.length === 0) return;

      const missing = requiredPermissions.filter(
        (requiredPerm) => !permissionsKeys.includes(requiredPerm)
      );

      if (missing.length > 0) {
        missingDependencies[permissionId] = missing;
      }
    });

    if (Object.keys(missingDependencies).length > 0) {
      const message = getValidationErrorMessage(missingDependencies);
      return NextResponse.json(
        {
          message: message,
        },
        { status: 400 }
      );
    }

    const createdRole = await prisma.role.create({
      data: {
        name,
        description: description || "",
        rolePermissions: {
          createMany: {
            data: matchedPermissions.map((perm) => ({
              permissionId: perm.id,
            })),
          },
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({ status: 201, data: createdRole,success:true });
  } catch (err) {
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
