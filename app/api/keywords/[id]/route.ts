/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

// PUT update keyword - Admin only
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FILTERS_MANAGE);
    if (error) return error;

    const { name } = await req.json();
    const { id } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Keyword name is required" },
        { status: 400 }
      );
    }

    const keyword = await prisma.keyword.update({
      where: { id },
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
    console.error("Error updating keyword:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Keyword already exists" },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE keyword - Admin only
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FILTERS_MANAGE);
    if (error) return error;

    const { id } = params;

    await prisma.keyword.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting keyword:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
