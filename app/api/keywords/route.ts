/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET() {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FILTERS_VIEW);
    if (error) return error;

    const keywords = await prisma.keyword.findMany({
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error("Error fetching keywords:", error);
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

    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du mot-clé est requis" },
        { status: 400 }
      );
    }

    const keyword = await prisma.keyword.create({
      data: {
        name: name.trim(),
      },
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
    });

    return NextResponse.json(keyword);
  } catch (error: any) {
    console.error("Error creating keyword:", error);
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
