import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.GROUPS_VIEW);
    if (error) return error;

    const { id } = params;
    const path = await getGroupsPath(id);

    return NextResponse.json(path);
  } catch (error) {
    console.error("Error fetching group path:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

async function getGroupsPath(
  groupId: string
): Promise<Array<{ id: string; name: string }>> {
  const folder = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  });

  if (!folder) {
    throw new Error("Group introuvable");
  }

  const path = [{ id: folder.id, name: folder.name }];

  if (folder.parentId) {
    const parentPath = await getGroupsPath(folder.parentId);
    return [...parentPath, ...path];
  }

  return path;
}
