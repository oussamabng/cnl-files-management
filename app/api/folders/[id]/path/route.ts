import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FOLDERS_VIEW);
    if (error) return error;

    const { id } = await params;
    const path = await getFolderPath(id);

    return NextResponse.json(path);
  } catch (error) {
    console.error("Error fetching folder path:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" }, // Translated
      { status: 500 },
    );
  }
}

async function getFolderPath(
  folderId: string,
): Promise<Array<{ id: string; name: string }>> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  });

  if (!folder) {
    throw new Error("Dossier introuvable"); // Translated
  }

  const path = [{ id: folder.id, name: folder.name }];

  if (folder.parentId) {
    const parentPath = await getFolderPath(folder.parentId);
    return [...parentPath, ...path];
  }

  return path;
}
