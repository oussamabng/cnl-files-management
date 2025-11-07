/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_VIEW);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");

    console.log("[API] GET /api/keyword-groups", { parentId });

    const groups = await prisma.keywordGroup.findMany({
      where: parentId ? { parentId } : { parentId: null },
      include: {
        _count: { select: { children: true, keywords: true } },
      },
      orderBy: { name: "asc" },
    });

    console.log("[API] Groups fetched:", groups.length);

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("[API] Error fetching keyword groups:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_CREATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { name, keywordIds, parentId } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du groupe est requis" },
        { status: 400 }
      );
    }

    if (parentId && typeof parentId !== "string") {
      return NextResponse.json(
        { error: "parentId doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    if (parentId === name) {
      return NextResponse.json(
        { error: "Un groupe ne peut pas être son propre parent" },
        { status: 400 }
      );
    }
    if (parentId) {
      const parentGroup = await prisma.keywordGroup.findUnique({
        where: { id: parentId },
      });
      if (!parentGroup) {
        return NextResponse.json(
          { error: "Le groupe parent n'existe pas" },
          { status: 400 }
        );
      }
    }

    const group = await prisma.keywordGroup.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        keywords: {
          create: (keywordIds || []).map((id: string) => ({
            keyword: { connect: { id } },
          })),
        },
      },
      include: {
        keywords: {
          include: { keyword: { select: { id: true, name: true } } },
        },
        children: true,
      },
    });

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error creating keyword group:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
