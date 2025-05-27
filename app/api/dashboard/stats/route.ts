import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get total counts
    const [totalFiles, totalKeywords, totalFolders, recentFiles, topKeywords] =
      await Promise.all([
        // Total files count
        prisma.file.count(),

        // Total keywords count
        prisma.keyword.count(),

        // Total folders count
        prisma.folder.count(),

        // Recent files (last 7 days)
        prisma.file.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Top 5 most used keywords
        prisma.keyword.findMany({
          include: {
            _count: {
              select: {
                files: true,
              },
            },
          },
          orderBy: {
            files: {
              _count: "desc",
            },
          },
          take: 5,
        }),
      ]);

    // Get files without keywords
    const filesWithoutKeywords = await prisma.file.count({
      where: {
        keywords: {
          none: {},
        },
      },
    });

    // Get unused keywords
    const unusedKeywords = await prisma.keyword.count({
      where: {
        files: {
          none: {},
        },
      },
    });

    // Get folders without any files or subfolders (empty folders)
    const emptyFolders = await prisma.folder.count({
      where: {
        AND: [
          {
            files: {
              none: {},
            },
          },
          {
            children: {
              none: {},
            },
          },
        ],
      },
    });

    return NextResponse.json({
      totalFiles,
      totalKeywords,
      totalFolders,
      recentFiles,
      filesWithoutKeywords,
      unusedKeywords,
      emptyFolders,
      topKeywords: topKeywords.map((keyword) => ({
        id: keyword.id,
        name: keyword.name,
        fileCount: keyword._count.files,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
