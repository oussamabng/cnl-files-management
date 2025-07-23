/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/server/requireApiPermission";

// GET single folder with details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FOLDERS_VIEW);
    if (error) return error;

    const { id } = params;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          include: {
            _count: {
              select: {
                children: true,
                files: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        files: {
          include: {
            keywords: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update folder - Admin only
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FOLDERS_MANAGE);
    if (error) return error;

    const { name, parentId } = await req.json();
    const { id } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Prevent moving folder to be its own child (circular reference)
    if (parentId === id) {
      return NextResponse.json(
        { error: "Cannot move folder to itself" },
        { status: 400 }
      );
    }

    // Check if moving to a descendant (would create circular reference)
    if (parentId) {
      const isDescendant = await checkIfDescendant(id, parentId);
      if (isDescendant) {
        return NextResponse.json(
          { error: "Cannot move folder to its own descendant" },
          { status: 400 }
        );
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    return NextResponse.json(folder);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error updating folder:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Folder name already exists in this location" },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE folder - Admin only
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FOLDERS_MANAGE);
    if (error) return error;

    const { id } = params;

    // Check if folder has children or files
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder._count.children > 0 || folder._count.files > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder that contains files or subfolders" },
        { status: 400 }
      );
    }

    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting folder:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check if a folder is a descendant of another
async function checkIfDescendant(
  folderId: string,
  potentialAncestorId: string
): Promise<boolean> {
  const descendants = await prisma.folder.findMany({
    where: {
      parentId: folderId,
    },
    select: {
      id: true,
    },
  });

  for (const descendant of descendants) {
    if (descendant.id === potentialAncestorId) {
      return true;
    }
    if (await checkIfDescendant(descendant.id, potentialAncestorId)) {
      return true;
    }
  }

  return false;
}
