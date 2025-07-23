// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/server/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.USERS_MANAGE);
    if (error) return error;
    const id = await params.id;

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
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 200, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.USERS_MANAGE);

    if (error)
      return NextResponse.json({ message: "accès non autorisé", status: 403 });

    const { firstName, lastName, email, password, roleIds } = await req.json();
    const userId = await params.id;
    const { id } = await params;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !Array.isArray(roleIds)
    ) {
      return NextResponse.json(
        { error: "Champs requis manquants ou invalides" },
        { status: 400 }
      );
    }

    // Check if email is unique (excluding current user)
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Update user details
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        password,
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
      },
    });

    return NextResponse.json({ status: 200, data: updatedUser, success: true });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.USERS_MANAGE);
    if (error) return error;

    const userId = await params.id;

    // First, delete related userRoles
    await prisma.userRole.deleteMany({
      where: {
        userId,
      },
    });

    // Then, delete the user
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({ status: 200, message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
