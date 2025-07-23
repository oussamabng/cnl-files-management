import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/server/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.USERS_MANAGE);
    if (error) return error;

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

    return NextResponse.json({ status: 200, data: result });
  } catch (err) {
    console.error("Error fetching roles:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
