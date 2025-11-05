/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { slugify } from '@/lib/utils';

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
    const { name, description, keywordIds, isActive } = await req.json();

    const slug = slugify ? slugify(name) : name?.toLowerCase()?.replace(/\s+/g, "-");

    const updated = await prisma.keywordGroup.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description || null,
        slug: slug || undefined,
        isActive: isActive ?? true,
        // reset and reconnect keywords
        keywords: {
          deleteMany: {}, // clear existing associations
          create: (keywordIds || []).map((kid: string) => ({
            keyword: { connect: { id: kid } },
          })),
        },
      },
      include: {
        keywords: {
          include: { keyword: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating keyword group:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
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

    await prisma.keywordGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting keyword group:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
