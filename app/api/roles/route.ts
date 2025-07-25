import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET() {
  try {
    const response = await requireApiPermission([PERMISSIONS.ROLES_VIEW,PERMISSIONS.USERS_CREATE]);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const roles = await prisma.role.findMany({
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
        { error: "Entrée invalide. 'name' et 'permissionIds' sont requis." }, // Translated
        { status: 400 }
      );
    }

    // 🔍 Optional: check for existing role name
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: `Le rôle "${name}" existe déjà.` }, // Translated
        { status: 409 }
      );
    }

    // 🔐 Fetch permission IDs by key
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
          error: `Clé(s) de permission invalide(s) : ${invalidKeys.join(", ")}`,
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

    return NextResponse.json({ status: 201, data: createdRole });
  } catch (err) {
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
