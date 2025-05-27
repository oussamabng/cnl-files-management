/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

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

// GET files with search and filter - Allow both admin and utilisateur
export async function GET(req: Request) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Both admin and utilisateur can read files
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const keywordIds =
      searchParams.get("keywords")?.split(",").filter(Boolean) || [];
    const folderId = searchParams.get("folderId"); // Can be null, empty string, or actual ID
    const filterMode = searchParams.get("mode") || "OR"; // AND or OR
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const whereClause: any = {};

    // Add folder filter - search recursively in child folders
    if (folderId && folderId !== "") {
      // Get all descendant folder IDs
      const descendantIds = await getDescendantFolderIds(folderId);
      const allFolderIds = [folderId, ...descendantIds];

      whereClause.folderId = {
        in: allFolderIds,
      };
    }
    // If no folderId is provided, we search ALL files (don't add folder filter)

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
        // File must have ALL selected keywords
        whereClause.AND = keywordIds.map((keywordId) => ({
          keywords: {
            some: {
              id: keywordId,
            },
          },
        }));
      } else {
        // File must have ANY of the selected keywords
        whereClause.keywords = {
          some: {
            id: {
              in: keywordIds,
            },
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
        // Add one day to include the end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        whereClause.dateTexte.lt = endDate;
      }
    }

    const files = await prisma.file.findMany({
      where: whereClause,
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
      orderBy: {
        [sortBy]: sortOrder,
      },
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

// POST upload files - Allow both admin and utilisateur
export async function POST(req: Request) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Both admin and utilisateur can upload files
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const keywordIds = JSON.parse(
      (formData.get("keywordIds") as string) || "[]"
    );
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

    // Validate folder exists if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Dossier non trouvé" },
          { status: 404 }
        );
      }
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "data", "uploads");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = file.name;
      const customName = customNames[i] || originalName;

      // Generate unique name if needed (check within the same folder)
      let finalName = customName;
      let counter = 1;

      // Check database for existing names in the same folder
      while (true) {
        const existingFile = await prisma.file.findFirst({
          where: {
            name: finalName,
            folderId: folderId,
          },
        });

        if (!existingFile) break;

        const nameWithoutExt = customName.replace(/\.[^/.]+$/, "");
        const extension = customName.match(/\.[^/.]+$/)?.[0] || "";
        finalName = `${nameWithoutExt}_${counter}${extension}`;
        counter++;
      }

      // Also check filesystem for existing files
      let finalPath = path.join(dataDir, finalName);
      counter = 1;
      while (fs.existsSync(finalPath)) {
        const nameWithoutExt = customName.replace(/\.[^/.]+$/, "");
        const extension = customName.match(/\.[^/.]+$/)?.[0] || "";
        const uniqueName = `${nameWithoutExt}_${counter}${extension}`;
        finalPath = path.join(dataDir, uniqueName);
        finalName = uniqueName;
        counter++;
      }

      // Save file to data/uploads directory
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      fs.writeFileSync(finalPath, buffer);

      console.log(`Fichier sauvegardé: ${finalPath}`);

      // Save file metadata to database
      const savedFile = await prisma.file.create({
        data: {
          name: finalName,
          path: `/api/files/serve/${finalName}`, // API route to serve the file
          folderId: folderId,
          dateTexte: dateTexte ? new Date(dateTexte) : null,
          commentaire: commentaire || null,
          keywords: {
            connect: keywordIds.map((id: string) => ({ id })),
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
