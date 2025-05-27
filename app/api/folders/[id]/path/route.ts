import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// GET folder path for breadcrumbs
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const path = await getFolderPath(id);
    return NextResponse.json(path);
  } catch (error) {
    console.error("Error fetching folder path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getFolderPath(
  folderId: string
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
    throw new Error("Folder not found");
  }

  const path = [{ id: folder.id, name: folder.name }];

  if (folder.parentId) {
    const parentPath = await getFolderPath(folder.parentId);
    return [...parentPath, ...path];
  }

  return path;
}
