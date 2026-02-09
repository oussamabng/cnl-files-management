/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_VIEW);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }
    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            _count: {
              select: {
                children: true,
                keywords: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        keywords: {
          select: {
            id: true,
            name: true,
          },

          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            children: true,
            keywords: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_UPDATE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { name, parentId } = await req.json();
    const { id } = await params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du group est requis" },
        { status: 400 },
      );
    }

    if (parentId === id) {
      return NextResponse.json(
        { error: "Impossible de déplacer le group vers lui-même" },
        { status: 400 },
      );
    }

    if (parentId) {
      const isDescendant = await checkIfDescendant(id, parentId);
      if (isDescendant) {
        return NextResponse.json(
          {
            error:
              "Impossible de déplacer le group vers l'un de ses descendants",
          },
          { status: 400 },
        );
      }
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
      include: {
        _count: {
          select: {
            children: true,
            keywords: true,
          },
        },
      },
    });

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error updating group:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un group avec ce nom existe déjà à cet emplacement" },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_DELETE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            keywords: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 },
      );
    }

    if (group._count.children > 0 || group._count.keywords > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer un dossier contenant des fichiers ou des sous-dossiers",
        },
        { status: 400 },
      );
    }

    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting groups:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Groupe introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

async function checkIfDescendant(
  groupId: string,
  potentialAncestorId: string,
): Promise<boolean> {
  const descendants = await prisma.group.findMany({
    where: {
      parentId: groupId,
    },
    select: {
      id: true,
    },
  });

  for (const descendant of descendants) {
    if (descendant.id === potentialAncestorId) {
      return true;
    }
    if (await checkIfDescendant(descendant.id, potentialAncestorId)) {
      return true;
    }
  }
  return false;
}
