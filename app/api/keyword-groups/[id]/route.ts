/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { slugify } from "@/lib/utils";

async function isCircularParent(
  childId: string,
  parentId: string | null
): Promise<boolean> {
  if (!parentId) return false;
  if (childId === parentId) return true;

  let currentParentId: string | null = parentId;

  while (currentParentId) {
    const parent: { parentId: string | null } | null =
      await prisma.keywordGroup.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

    if (!parent) break;

    if (parent.parentId === childId) return true;

    currentParentId = parent.parentId;
  }

  return false;
}

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

    const { id } = params;
    const { name, description, keywordIds, isActive, parentId } =
      await req.json();

    // Validate parentId
    if (parentId) {
      const parentGroup = await prisma.keywordGroup.findUnique({
        where: { id: parentId },
      });
      if (!parentGroup) {
        return NextResponse.json(
          { error: "Le groupe parent n'existe pas" },
          { status: 400 }
        );
      }
      const circular = await isCircularParent(id, parentId);
      if (circular) {
        return NextResponse.json(
          { error: "Un groupe ne peut pas devenir son propre ancêtre" },
          { status: 400 }
        );
      }
    }

    const slug = slugify
      ? slugify(name)
      : name?.toLowerCase()?.replace(/\s+/g, "-");

    const updated = await prisma.keywordGroup.update({
      where: { id },
      data: {
        name: name?.trim(),
        slug: slug || undefined,
        parentId: parentId || null,
        keywords: {
          deleteMany: {}, // reset keywords
          create: (keywordIds || []).map((kid: string) => ({
            keyword: { connect: { id: kid } },
          })),
        },
      },
      include: {
        keywords: {
          include: { keyword: { select: { id: true, name: true } } },
        },
        children: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating keyword group:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Groupe introuvable" },
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

    // Optionally: check if children exist before deletion
    const group = await prisma.keywordGroup.findUnique({
      where: { id },
      select: { children: { select: { id: true } } },
    });

    if (group?.children?.length) {
      // Either delete cascade (Prisma handles this if onDelete: Cascade) or prevent deletion
      // return NextResponse.json({ error: "Impossible de supprimer un groupe avec des sous-groupes" }, { status: 400 });
    }

    await prisma.keywordGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting keyword group:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Groupe introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
