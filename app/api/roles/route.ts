import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PERMISSION_DEPENDENCIES,
  PERMISSIONS,
  type PermissionValue,
} from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { getValidationErrorMessage } from "@/lib/utils";

function toInt(v: string | null, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  try {
    const auth = await requireApiPermission(PERMISSIONS.ROLES_VIEW);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error, message: auth.message, success: false },
        { status: auth.status }
      );
    }

    const url = new URL(req.url);

    const pageIndex = clamp(
      toInt(url.searchParams.get("pageIndex"), 0),
      0,
      1_000_000
    );
    const pageSize = clamp(toInt(url.searchParams.get("pageSize"), 10), 1, 100);

    const sortBy = url.searchParams.get("sortBy") || "name";
    const sortDir =
      (url.searchParams.get("sortDir") || "asc").toLowerCase() === "desc"
        ? "desc"
        : "asc";

    const qRaw = (url.searchParams.get("q") || "").trim();
    const q = qRaw.length ? qRaw : null;

    const allowedSortBy = new Set(["name", "createdAt"]);
    const effectiveSortBy = allowedSortBy.has(sortBy) ? sortBy : "name";

    const where: any = {
      AND: [
        { name: { not: "SUPERADMIN" } },
        ...(q ? [{ name: { contains: q, mode: "insensitive" } }] : []),
      ],
    };

    const skip = pageIndex * pageSize;
    const take = pageSize;

    const [total, roles, assignedUsersCount, uniquePermissions] =
      await prisma.$transaction([
        prisma.role.count({ where }),
        prisma.role.findMany({
          where,
          include: {
            rolePermissions: {
              include: { permission: true },
            },
            _count: {
              select: { userRoles: true },
            },
          },
          orderBy: {
            [effectiveSortBy]: sortDir,
          } as any,
          skip,
          take,
        }),
        prisma.userRole.count({
          where: {
            role: { name: { not: "SUPERADMIN" } },
          },
        }),
        prisma.rolePermission.findMany({
          where: { role: { name: { not: "SUPERADMIN" } } },
          distinct: ["permissionId"],
          select: { permissionId: true },
        }),
      ]);

    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: roles,
      meta: {
        pageIndex,
        pageSize,
        total,
        pageCount,
      },
      stats: {
        totalRoles: total,
        assignedUsersCount,
        uniquePermissionsCount: uniquePermissions.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Erreur interne du serveur", success: false },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.ROLES_CREATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message, success: false },
        { status: response.status }
      );
    }

    const body = await req.json();
    const { name, description, permissionIds } = body as {
      name?: string;
      description?: string;
      permissionIds?: number[];
    };

    if (!name || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        {
          error: "Entrée invalide. 'name' et 'permissionIds' sont requis.",
          success: false,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { message: `Le rôle "${name}" existe déjà.`, success: false },
        { status: 409 }
      );
    }

    const matchedPermissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true, key: true },
    });

    if (matchedPermissions.length !== permissionIds.length) {
      const matchedIds = new Set(matchedPermissions.map((p) => p.id));
      const invalidIds = permissionIds.filter((id) => !matchedIds.has(id));
      return NextResponse.json(
        {
          message: `ID(s) de permission invalide(s) : ${invalidIds.join(", ")}`,
          success: false,
        },
        { status: 400 }
      );
    }

    const permissionKeys = matchedPermissions.map(
      (p) => p.key
    ) as PermissionValue[];

    const permissionKeySet = new Set<PermissionValue>(permissionKeys);

    const missingDependencies: Partial<
      Record<PermissionValue, PermissionValue[]>
    > = {};

    for (const perm of permissionKeys) {
      const required = PERMISSION_DEPENDENCIES[perm];
      if (!required?.length) continue;

      const missing = required.filter(
        (reqPerm) => !permissionKeySet.has(reqPerm as PermissionValue)
      );
      if (missing.length)
        missingDependencies[perm] = missing as PermissionValue[];
    }

    if (Object.keys(missingDependencies).length) {
      return NextResponse.json(
        {
          message: getValidationErrorMessage(
            missingDependencies as Record<PermissionValue, PermissionValue[]>
          ),
          success: false,
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
            data: matchedPermissions.map((perm) => ({ permissionId: perm.id })),
          },
        },
      },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });

    return NextResponse.json({ status: 201, data: createdRole, success: true });
  } catch (err) {
    return NextResponse.json(
      { message: "Erreur interne du serveur", success: false },
      { status: 500 }
    );
  }
}
