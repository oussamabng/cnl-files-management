/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { slugify } from "@/lib/utils"; // optional helper (you can inline if not present)

// ✅ GET all keyword groups
export async function GET() {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_VIEW);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const groups = await prisma.keywordGroup.findMany({
      where: { isActive: true },
      include: {
        keywords: {
          include: {
            keyword: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching keyword groups:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// ✅ CREATE a new keyword group
export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.FILTERS_CREATE);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const { name, description, keywordIds } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du groupe est requis" },
        { status: 400 }
      );
    }

    const slug = slugify
      ? slugify(name)
      : name.toLowerCase().replace(/\s+/g, "-");

    const existing = await prisma.keywordGroup.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Un groupe avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const group = await prisma.keywordGroup.create({
      data: {
        name: name.trim(),
        description: description || null,
        slug,
        isActive: true,
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
