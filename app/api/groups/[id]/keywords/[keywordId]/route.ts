/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; keywordId: string } }
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.GROUPS_UPDATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { id: groupId, keywordId } = params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Groupe introuvable" },
        { status: 404 }
      );
    }

    const keyword = await prisma.keyword.findUnique({
      where: { id: keywordId },
      select: { id: true },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: "Mot-clé introuvable" },
        { status: 404 }
      );
    }

    await prisma.group.update({
      where: { id: groupId },
      data: {
        keywords: {
          disconnect: { id: keywordId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing keyword from group:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
