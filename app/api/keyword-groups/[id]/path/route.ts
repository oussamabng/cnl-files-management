/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

/**
 * GET /api/keyword-groups/:id/path
 * Returns the full path from root to the group for breadcrumbs
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    const response = await requireApiPermission(PERMISSIONS.FILTERS_VIEW);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const groupId = await  params.id;
    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Fetch the current group
    let current = await prisma.keywordGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, parentId: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Build the path by walking up parentId
    const path: Array<{ id: string; name: string }> = [];
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      if (!current.parentId) break;
      current = await prisma.keywordGroup.findUnique({
        where: { id: current.parentId },
        select: { id: true, name: true, parentId: true },
      });
    }

    return NextResponse.json(path);
  } catch (error: any) {
    console.error("Error fetching breadcrumb path:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
