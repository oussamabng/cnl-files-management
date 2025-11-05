/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

/**
 * GET /api/keyword-groups/:id/keywords
 * Returns all keywords assigned to a specific group with file counts
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

    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Fetch keywords assigned to the group
    const keywords = await prisma.keyword.findMany({
      where: {
        groupLinks: {
          some: { groupId },
        },
      },
      select: {
        id: true,
        name: true,
        files: true, // to calculate fileCount
      },
    });

    // Map keywords with fileCount
    const result = keywords.map((k) => ({
      id: k.id,
      name: k.name,
      fileCount: k.files.length,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching group keywords:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
