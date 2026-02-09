import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.ROLES_UPDATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }
    const { id } = await params;
    const roleId = Number(id);
    const body = await req.json();
    const { name, permissionIds, description } = body;

    console.log("Received data:", { name, permissionIds, description });

    if (!name || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Entrée invalide. 'name' et 'permissionIds' sont requis." }, // Translated
        { status: 400 },
      );
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description,
        rolePermissions: {
          deleteMany: {},
          create: permissionIds.map((permissionId: number) => ({
            permission: {
              connect: { id: permissionId },
            },
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return NextResponse.json({ status: 200, data: updatedRole }); // Changed to 200 for updates
  } catch (err) {
    console.error("Error updating role:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, // Translated
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = await requireApiPermission(PERMISSIONS.ROLES_DELETE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }
    const roleId = Number(id);

    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({
      status: 200,
      message: "Rôle supprimé avec succès", // Translated
    });
  } catch (err) {
    console.error("Error deleting role:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, // Translated
      { status: 500 },
    );
  }
}
