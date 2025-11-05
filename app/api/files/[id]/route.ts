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
    // Check permissions
    const response = await requireApiPermission(PERMISSIONS.FILES_UPDATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const {
      name,
      keywordIds = [],
      groupIds = [],
      folderId,
      dateTexte,
      commentaire,
    } = await req.json();
    const { id } = params;

    // Validate file name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du fichier est requis" },
        { status: 400 }
      );
    }

    // Check for duplicate name in other files
    const existingFile = await prisma.file.findFirst({
      where: {
        name: name.trim(),
        NOT: { id },
      },
    });
    if (existingFile) {
      return NextResponse.json(
        { error: "Le nom du fichier existe déjà" },
        { status: 409 }
      );
    }

    // Fetch keywords from the selected groups
    let groupKeywordIds: string[] = [];
    if (groupIds.length > 0) {
      const groupKeywords = await prisma.keywordGroupKeyword.findMany({
        where: { groupId: { in: groupIds } },
        select: { keywordId: true },
      });
      groupKeywordIds = groupKeywords.map((k) => k.keywordId);
    }

    // Combine explicit keywordIds with group keywords
    const allKeywordIds: string[] = Array.from(
      new Set([...keywordIds, ...groupKeywordIds])
    );

    // Update the file
    const file = await prisma.file.update({
      where: { id },
      data: {
        name: name.trim(),
        folderId: folderId || null,
        dateTexte: dateTexte ? new Date(dateTexte) : null,
        commentaire: commentaire || null,
        keywords: {
          set: [], // clear existing
          connect: allKeywordIds.map((keywordId) => ({ id: keywordId })),
        },
      },
      include: {
        keywords: {
          select: {
            id: true,
            name: true,
            groupLinks: {
              include: { group: true },
            },
          },
        },
        folder: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(file);
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du fichier:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
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
    const response = await requireApiPermission(PERMISSIONS.FILES_DELETE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { id } = params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    await prisma.file.delete({
      where: { id },
    });

    // Assuming deleteFile is defined elsewhere and handles file system deletion
    // const deleted = deleteFile(file.name);
    // if (!deleted) {
    //   console.warn(`Le fichier ${file.name} a été supprimé de la base de données mais non trouvé sur le système de fichiers`);
    // }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du fichier:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
