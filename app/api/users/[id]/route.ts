// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.USERS_VIEW);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { status: 404, message: "Aucun utilisateur" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: 200, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.USERS_DELETE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { firstName, lastName, email, password, roleIds } = await req.json();
    const { id } = await params;

    if (!firstName || !lastName || !email || !Array.isArray(roleIds)) {
      return NextResponse.json(
        { message: "Champs requis manquants ou invalides" },
        { status: 400 },
      );
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 },
      );
    }

    const updateData: any = {
      firstName,
      lastName,
      email,
      userRoles: {
        deleteMany: {},
        create: roleIds.map((roleId: string) => ({
          role: {
            connect: {
              id: Number(roleId),
            },
          },
        })),
      },
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ status: 200, data: updatedUser, success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.USERS_DELETE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { id } = await params;

    await prisma.userRole.deleteMany({
      where: {
        userId: id,
      },
    });

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ status: 200, message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
