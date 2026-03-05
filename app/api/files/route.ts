/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { getDescendantGroupIds } from "../groups/route";

// Helper function to get all descendant folder IDs
async function getDescendantFolderIds(folderId: string): Promise<string[]> {
  const children = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });

  let allDescendants = children.map((child) => child.id);

  for (const child of children) {
    const grandChildren = await getDescendantFolderIds(child.id);
    allDescendants = [...allDescendants, ...grandChildren];
  }

  return allDescendants;
}

function normalizeFilename(input: string) {
  return String(input || "")
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// For now, storagePath is just the filename (keeps your current disk layout)
// Later, if you want physical subfolders, you can change storagePath to include folderId.
function toStoragePath(filename: string) {
  return normalizeFilename(filename);
}

function toServeUrl(storagePathOrLegacy: string) {
  const storagePath = storagePathOrLegacy.startsWith("/api/files/serve/")
    ? storagePathOrLegacy.replace("/api/files/serve/", "")
    : storagePathOrLegacy;

  return `/api/files/serve/${encodeURI(storagePath)}`;
}

// GET files with search and filter - Allow both admin and utilisateur
export async function GET(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_VIEW);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const keywordIds =
      searchParams.get("keywords")?.split(",").filter(Boolean) || [];
    const groupIds =
      searchParams.get("groups")?.split(",").filter(Boolean) || [];
    const folderId = searchParams.get("folderId"); // Can be null, empty string, or actual ID
    const filterMode = searchParams.get("mode") || "OR"; // AND or OR
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const whereClause: any = {};

    // Add folder filter - search recursively in child folders
    if (folderId && folderId !== "") {
      const descendantIds = await getDescendantFolderIds(folderId);
      const allFolderIds = [folderId, ...descendantIds];

      whereClause.folderId = {
        in: allFolderIds,
      };
    }

    // Add name search
    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Add keyword filtering
    if (keywordIds.length > 0) {
      if (filterMode === "AND") {
        whereClause.AND = keywordIds.map((keywordId) => ({
          keywords: {
            some: { id: keywordId },
          },
        }));
      } else {
        whereClause.keywords = {
          some: {
            id: { in: keywordIds },
          },
        };
      }
    }

    // Add group filtering (including descendants)
    if (groupIds.length > 0) {
      const allGroupIds: string[] = [];
      for (const groupId of groupIds) {
        const descendants = await getDescendantGroupIds(groupId);
        allGroupIds.push(groupId, ...descendants);
      }

      if (filterMode === "AND") {
        whereClause.AND = allGroupIds.map((id) => ({
          groups: { some: { id } },
        }));
      } else {
        whereClause.groups = {
          some: {
            id: { in: allGroupIds },
          },
        };
      }
    }

    // Add date range filtering
    if (dateFrom || dateTo) {
      whereClause.dateTexte = {};

      if (dateFrom) {
        whereClause.dateTexte.gte = new Date(dateFrom);
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        whereClause.dateTexte.lt = endDate;
      }
    }

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        keywords: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
        groups: { select: { id: true, name: true } },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // IMPORTANT:
    // - We now treat DB "path" as a storage path (relative), not an API URL.
    // - To keep the frontend working, we expose `url`.
    // - For legacy rows where path was "/api/files/serve/<name>", we still generate a correct url.
    const withUrl = files.map((f) => ({
      ...f,
      url: toServeUrl(f.path || f.name),
    }));

    return NextResponse.json(withUrl);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILES_UPLOAD);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status },
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const keywordIds = JSON.parse(
      (formData.get("keywordIds") as string) || "[]",
    );
    const groupIds = JSON.parse((formData.get("groupIds") as string) || "[]");
    const customNames = JSON.parse(
      (formData.get("customNames") as string) || "{}",
    );
    const folderId = (formData.get("folderId") as string) || null;
    const dateTexte = formData.get("dateTexte") as string;
    const commentaire = formData.get("commentaire") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 },
      );
    }

    // Validate folder exists if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Dossier non trouvé" },
          { status: 404 },
        );
      }
    }

    // Disk storage base (matches your serve route reading from data/uploads)
    const dataDir = path.join(process.cwd(), "data", "uploads");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const uploadedFiles: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = normalizeFilename(file.name);
      const customName = normalizeFilename(customNames[i] || originalName);

      if (!customName) {
        return NextResponse.json(
          { error: "Nom de fichier invalide" },
          { status: 400 },
        );
      }

      // Generate unique name if needed (check within the same folder in DB)
      let finalName = customName;
      let counter = 1;

      while (true) {
        const existingFile = await prisma.file.findFirst({
          where: { name: finalName, folderId },
        });

        if (!existingFile) break;

        const nameWithoutExt = customName.replace(/\.[^/.]+$/, "");
        const extension = customName.match(/\.[^/.]+$/)?.[0] || "";
        finalName = `${nameWithoutExt}_${counter}${extension}`;
        counter++;
      }

      // Also check filesystem for existing files
      let storagePath = toStoragePath(finalName); // currently just finalName
      let finalPath = path.join(dataDir, storagePath);

      counter = 1;
      while (fs.existsSync(finalPath)) {
        const nameWithoutExt = customName.replace(/\.[^/.]+$/, "");
        const extension = customName.match(/\.[^/.]+$/)?.[0] || "";
        const uniqueName = `${nameWithoutExt}_${counter}${extension}`;
        finalName = uniqueName;
        storagePath = toStoragePath(finalName);
        finalPath = path.join(dataDir, storagePath);
        counter++;
      }

      // Ensure directory exists (in case storagePath later includes folders)
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(finalPath, buffer);

      console.log(`Fichier sauvegardé: ${finalPath}`);

      // Save DB record
      // IMPORTANT:
      // - We store `path` as a STORAGE PATH (relative), not "/api/files/serve/...".
      // - Frontend uses `url` we add below.
      const savedFile = await prisma.file.create({
        data: {
          name: finalName,
          path: storagePath,
          folderId,
          dateTexte: dateTexte ? new Date(dateTexte) : null,
          commentaire: commentaire || null,
          keywords: {
            connect: keywordIds.map((id: string) => ({ id })),
          },
          groups: {
            connect: groupIds.map((id: string) => ({ id })),
          },
        },
        include: {
          groups: { select: { id: true, name: true } },
          keywords: { select: { id: true, name: true } },
          folder: { select: { id: true, name: true } },
        },
      });

      uploadedFiles.push({
        ...savedFile,
        url: toServeUrl(savedFile.path || savedFile.name),
      });
    }

    return NextResponse.json(uploadedFiles);
  } catch (error: any) {
    console.error("Erreur lors du téléchargement des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
