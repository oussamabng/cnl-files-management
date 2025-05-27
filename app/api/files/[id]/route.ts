/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { deleteFile } from "@/lib/file-utils";

// PUT update file - Allow both admin and utilisateur
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Both admin and utilisateur can update files
    const { name, keywordIds, folderId, dateTexte, commentaire } =
      await req.json();
    const { id } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du fichier est requis" },
        { status: 400 }
      );
    }

    // Check if name is unique (excluding current file)
    const existingFile = await prisma.file.findFirst({
      where: {
        name: name.trim(),
        NOT: {
          id: id,
        },
      },
    });

    if (existingFile) {
      return NextResponse.json(
        { error: "Le nom du fichier existe déjà" },
        { status: 409 }
      );
    }

    const file = await prisma.file.update({
      where: { id },
      data: {
        name: name.trim(),
        folderId: folderId || null,
        dateTexte: dateTexte ? new Date(dateTexte) : null,
        commentaire: commentaire || null,
        keywords: {
          set: [], // Clear existing keywords
          connect: keywordIds.map((keywordId: string) => ({ id: keywordId })),
        },
      },
      include: {
        keywords: {
          select: {
            id: true,
            name: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
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

// DELETE file - Allow both admin and utilisateur
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Both admin and utilisateur can delete files
    const { id } = params;

    // Get file info before deleting from database
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Delete from database first
    await prisma.file.delete({
      where: { id },
    });

    // Then delete from filesystem
    const deleted = deleteFile(file.name);

    if (!deleted) {
      console.warn(
        `Le fichier ${file.name} a été supprimé de la base de données mais non trouvé sur le système de fichiers`
      );
    }

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
