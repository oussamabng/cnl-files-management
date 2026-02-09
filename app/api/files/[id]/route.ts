/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_UPDATE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { name, keywordIds, groupIds, folderId, dateTexte, commentaire } =
      await req.json();
    const { id } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du fichier est requis" },
        { status: 400 },
      );
    }

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
        { status: 409 },
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
          set: [],
          connect: (keywordIds || []).map((keywordId: string) => ({
            id: keywordId,
          })),
        },
        groups: {
          set: [],
          connect: (groupIds || []).map((groupId: string) => ({ id: groupId })),
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
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
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
  { params }: { params: { id: string } },
) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_DELETE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { id } = params;

    // 1) Get file first (we need the filename to delete it locally)
    const file = await prisma.file.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 },
      );
    }

    // 2) Delete local file from data/uploads
    const localPath = path.join(process.cwd(), "data", "uploads", file.name);

    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (e) {
      console.error("Failed to delete local file:", localPath, e);
      // strict mode: if local delete fails, do not delete DB
      return NextResponse.json(
        { error: "Impossible de supprimer le fichier local" },
        { status: 500 },
      );
    }

    // 3) Delete DB record
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du fichier:", error);
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
