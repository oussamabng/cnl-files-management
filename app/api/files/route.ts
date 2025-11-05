/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

// Helper: recursively get child folders
async function getDescendantFolderIds(folderId: string): Promise<string[]> {
  const children = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });

  let all = children.map((c) => c.id);
  for (const child of children) {
    all = all.concat(await getDescendantFolderIds(child.id));
  }
  return all;
}

// ================= GET =================
export async function GET(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_VIEW);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const keywordIds =
      searchParams.get("keywords")?.split(",").filter(Boolean) || [];
    const groupIds =
      searchParams.get("groups")?.split(",").filter(Boolean) || [];
    const folderId = searchParams.get("folderId");
    const filterMode = searchParams.get("mode") || "OR";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};

    // Folder filter
    if (folderId && folderId !== "") {
      const allFolders = [
        folderId,
        ...(await getDescendantFolderIds(folderId)),
      ];
      where.folderId = { in: allFolders };
    }

    // Text search
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Group filter (optional)
    if (groupIds.length > 0) {
      where.keywords = {
        some: {
          groupLinks: { some: { groupId: { in: groupIds } } },
        },
      };
    }

    // Keyword filter
    if (keywordIds.length > 0) {
      if (filterMode === "AND") {
        where.AND = keywordIds.map((keywordId) => ({
          keywords: { some: { id: keywordId } },
        }));
      } else {
        where.keywords = { some: { id: { in: keywordIds } } };
      }
    }

    // Date filter
    if (dateFrom || dateTo) {
      where.dateTexte = {};
      if (dateFrom) where.dateTexte.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.dateTexte.lt = endDate;
      }
    }

    const files = await prisma.file.findMany({
      where,
      include: {
        keywords: {
          include: {
            groupLinks: { include: { group: true } },
          },
        },
        folder: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_UPLOAD);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const keywordIds = JSON.parse(
      (formData.get("keywordIds") as string) || "[]"
    );
    const groupIds = JSON.parse((formData.get("groupIds") as string) || "[]");
    const customNames = JSON.parse(
      (formData.get("customNames") as string) || "{}"
    );
    const folderId = (formData.get("folderId") as string) || null;
    const dateTexte = formData.get("dateTexte") as string;
    const commentaire = formData.get("commentaire") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validate folder
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder)
        return NextResponse.json(
          { error: "Dossier non trouvé" },
          { status: 404 }
        );
    }

    // Resolve keyword IDs
    const existingKeywords = await prisma.keyword.findMany({
      where: { id: { in: keywordIds } },
      select: { id: true },
    });
    const existingKeywordIds = existingKeywords.map((k) => k.id);

    if (groupIds.length > 0) {
      const groupKeywords = await prisma.keywordGroupKeyword.findMany({
        where: { groupId: { in: groupIds } },
        select: { keywordId: true },
      });
      groupKeywords.forEach((k) => {
        if (!existingKeywordIds.includes(k.keywordId))
          existingKeywordIds.push(k.keywordId);
      });
    }

    const dataDir = path.join(process.cwd(), "data", "uploads");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = file.name;
      const customName = customNames[i] || originalName;
      let finalName = customName;
      let counter = 1;

      // Ensure unique name in DB + FS
      while (
        await prisma.file.findFirst({ where: { name: finalName, folderId } })
      ) {
        const base = customName.replace(/\.[^/.]+$/, "");
        const ext = customName.match(/\.[^/.]+$/)?.[0] || "";
        finalName = `${base}_${counter}${ext}`;
        counter++;
      }

      let finalPath = path.join(dataDir, finalName);
      counter = 1;
      while (fs.existsSync(finalPath)) {
        const base = customName.replace(/\.[^/.]+$/, "");
        const ext = customName.match(/\.[^/.]+$/)?.[0] || "";
        finalName = `${base}_${counter}${ext}`;
        finalPath = path.join(dataDir, finalName);
        counter++;
      }

      const bytes = await file.arrayBuffer();
      fs.writeFileSync(finalPath, Buffer.from(bytes));

      const savedFile = await prisma.file.create({
        data: {
          name: finalName,
          path: `/api/files/serve/${finalName}`,
          folderId,
          dateTexte: dateTexte ? new Date(dateTexte) : null,
          commentaire: commentaire || null,
          keywords: { connect: existingKeywordIds.map((id) => ({ id })) },
        },
        include: {
          keywords: { include: { groupLinks: { include: { group: true } } } },
          folder: { select: { id: true, name: true } },
        },
      });

      uploadedFiles.push(savedFile);
    }

    return NextResponse.json(uploadedFiles);
  } catch (error: any) {
    console.error("Erreur lors du téléchargement des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
