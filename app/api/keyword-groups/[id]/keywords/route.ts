/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("post request");
  
  const response = await requireApiPermission(PERMISSIONS.FILTERS_CREATE);
  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }
  const groupId = params.id;
  if (!groupId) {
    return NextResponse.json({ message: "Missing group id" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const keywordIds: string[] = Array.isArray(body?.keywordIds)
    ? body.keywordIds
    : [];

  if (keywordIds.length === 0) {
    return NextResponse.json(
      { message: "Aucun mot-clé sélectionné" },
      { status: 400 }
    );
  }

  try {
    // Verify group exists
    const group = await prisma.keywordGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      return NextResponse.json(
        { message: "Groupe introuvable" },
        { status: 404 }
      );
    }

    // Use createMany with skipDuplicates to avoid unique constraint errors
    const createData = keywordIds.map((keywordId) => ({
      keywordId,
      groupId,
    }));

    await prisma.keywordGroupKeyword.createMany({
      data: createData,
      skipDuplicates: true,
    });

    // Optionally return updated list of keywords for the group
    const updated = await prisma.keywordGroupKeyword.findMany({
      where: { groupId },
      include: { keyword: true },
    });

    return NextResponse.json(
      { success: true, keywords: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("[attach-keywords]", err);
    return NextResponse.json(
      { message: "Erreur lors de l'attachement des mots-clés" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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
