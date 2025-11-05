/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET() {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_VIEW);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const keywords = await prisma.keyword.findMany({
      include: {
        groupLinks: {
          include: {
            group: true,
          },
        },
        _count: {
          select: { files: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error("Erreur lors de la récupération des mots-clés:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log("[POST] Create keyword request received");

    // Check if user has permission to create a filter
    const response = await requireApiPermission(PERMISSIONS.FILTERS_CREATE);
    console.log("[POST] Permission check response:", response);

    if (!response.success) {
      console.log("[POST] Permission denied");
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    // Extract name and group IDs from request body
    const { name, groupIds } = await req.json();
    console.log("[POST] Request body:", { name, groupIds });

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      console.log("[POST] Invalid keyword name");
      return NextResponse.json(
        { error: "Le nom du mot-clé est requis" },
        { status: 400 }
      );
    }

    // Use transaction to create keyword and assign groups
    const keyword = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create the keyword
      const createdKeyword = await tx.keyword.create({
        data: { name: name.trim() },
      });
      console.log("[POST] Created keyword:", createdKeyword);

      // 2️⃣ Assign groups if provided
      if (Array.isArray(groupIds) && groupIds.length > 0) {
        const assignedGroups = await tx.keywordGroupKeyword.createMany({
          data: groupIds.map((groupId: string) => ({
            groupId,
            keywordId: createdKeyword.id,
          })),
          skipDuplicates: true,
        });
        console.log("[POST] Assigned groups:", groupIds, assignedGroups);
      } else {
        console.log("[POST] No groups to assign");
      }

      // 3️⃣ Return the keyword with its groups and file count
      const keywordWithGroups = await tx.keyword.findUnique({
        where: { id: createdKeyword.id },
        include: {
          groupLinks: { include: { group: true } },
          _count: { select: { files: true } },
        },
      });
      console.log("[POST] Keyword with groups fetched:", keywordWithGroups);

      return keywordWithGroups;
    });

    console.log("[POST] Transaction complete, returning keyword");
    return NextResponse.json(keyword);
  } catch (error: any) {
    console.error("[POST] Error creating keyword:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Le mot-clé existe déjà" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
