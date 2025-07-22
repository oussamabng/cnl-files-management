import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function GET() {
  console.log("_DASHOBARD_STATS_GET");

  try {
    const { error } = await requireApiPermission(
      PERMISSIONS.DASHBOARD_VIEW
    );
    if (error) return error;

    const [totalFiles, totalKeywords, totalFolders, recentFiles, topKeywords] =
      await Promise.all([
        prisma.file.count(),
        prisma.keyword.count(),
        prisma.folder.count(),
        prisma.file.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.keyword.findMany({
          include: {
            _count: {
              select: { files: true },
            },
          },
          orderBy: {
            files: { _count: "desc" },
          },
          take: 5,
        }),
      ]);

    const filesWithoutKeywords = await prisma.file.count({
      where: {
        keywords: {
          none: {},
        },
      },
    });

    const unusedKeywords = await prisma.keyword.count({
      where: {
        files: {
          none: {},
        },
      },
    });

    const emptyFolders = await prisma.folder.count({
      where: {
        AND: [{ files: { none: {} } }, { children: { none: {} } }],
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
