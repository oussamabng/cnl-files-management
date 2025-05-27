/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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

// GET all folders with hierarchy
export async function GET(req: Request) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") || null;
    const includeFiles = searchParams.get("includeFiles") === "true";
    const includeHierarchy = searchParams.get("includeHierarchy") === "true";

    if (includeHierarchy) {
      // Return all folders for building hierarchy with recursive file counts
      const folders = await prisma.folder.findMany({
        orderBy: {
          name: "asc",
        },
      });

      // Calculate recursive file counts for each folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          // Get all descendant folder IDs
          const descendantIds = await getDescendantFolderIds(folder.id);
          const allFolderIds = [folder.id, ...descendantIds];

          // Count files in this folder and all descendants
          const totalFiles = await prisma.file.count({
            where: {
              folderId: {
                in: allFolderIds,
              },
            },
          });

          // Count direct children folders
          const directChildren = await prisma.folder.count({
            where: { parentId: folder.id },
          });

          // Count ALL descendant folders (recursive)
          const totalFolders = descendantIds.length;

          return {
            ...folder,
            _count: {
              children: directChildren,
              files: totalFiles, // This now includes files from all descendants
              folders: totalFolders, // Total folders in this hierarchy
            },
          };
        })
      );

      return NextResponse.json(foldersWithCounts);
    }

    // Get folders with optional parent filter (existing logic)
    const folders = await prisma.folder.findMany({
      where: {
        parentId: parentId,
      },
      include: {
        ...(includeFiles && {
          files: {
            include: {
              keywords: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        }),
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate recursive counts for the filtered folders
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        // Get all descendant folder IDs
        const descendantIds = await getDescendantFolderIds(folder.id);
        const allFolderIds = [folder.id, ...descendantIds];

        // Count files in this folder and all descendants
        const totalFiles = await prisma.file.count({
          where: {
            folderId: {
              in: allFolderIds,
            },
          },
        });

        // Count direct children folders
        const directChildren = await prisma.folder.count({
          where: { parentId: folder.id },
        });

        // Count ALL descendant folders (recursive)
        const totalFolders = descendantIds.length;

        return {
          ...folder,
          _count: {
            children: directChildren,
            files: totalFiles,
            folders: totalFolders,
          },
        };
      })
    );

    return NextResponse.json(foldersWithCounts);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new folder - Admin only
export async function POST(req: Request) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { name, parentId } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Validate parent folder exists if parentId is provided
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
    });

    // Calculate recursive counts for the new folder
    const descendantIds = await getDescendantFolderIds(folder.id);
    const allFolderIds = [folder.id, ...descendantIds];

    const totalFiles = await prisma.file.count({
      where: {
        folderId: {
          in: allFolderIds,
        },
      },
    });

    const directChildren = await prisma.folder.count({
      where: { parentId: folder.id },
    });

    // Count ALL descendant folders (recursive)
    const totalFolders = descendantIds.length;

    return NextResponse.json({
      ...folder,
      _count: {
        children: directChildren,
        files: totalFiles,
        folders: totalFolders,
      },
    });
  } catch (error: any) {
    console.error("Error creating folder:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Folder name already exists in this location" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
