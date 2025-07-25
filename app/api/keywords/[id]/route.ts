/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_UPDATE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }
    const { name } = await req.json();
    const { id } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du mot-clé est requis" },
        { status: 400 }
      );
    }

    const keyword = await prisma.keyword.update({
      where: { id },
      data: {
        name: name.trim(),
      },
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
    });

    return NextResponse.json(keyword);
  } catch (error: any) {
    console.error("Error updating keyword:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Le mot-clé existe déjà" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Mot-clé introuvable" },
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
    const response = await requireApiPermission(PERMISSIONS.FILTERS_DELETE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { id } = params;

    await prisma.keyword.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting keyword:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Mot-clé introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
