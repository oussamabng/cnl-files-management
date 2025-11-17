import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET() {
  const response = await requireApiPermission([PERMISSIONS.ROLES_VIEW,PERMISSIONS.USERS_CREATE,PERMISSIONS.USERS_UPDATE]);

  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ status: 200, data: permissions });
  } catch (error) {
    console.error("Erreur lors de la récupération des autorisations", error);
    return NextResponse.json(
      { status: 500, error: "Échec de la récupération des autorisations" },
      { status: 500 }
    );
  }
}
