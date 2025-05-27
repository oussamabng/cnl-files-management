/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// GET all keywords - Allow both admin and utilisateur to read
export async function GET() {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Both admin and utilisateur can read keywords for filtering and file operations
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new keyword - Admin only
export async function POST(req: Request) {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Keyword name is required" },
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
        { error: "Keyword already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
