import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

export async function GET() {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.DASHBOARD_VIEW);
    if (error) return error;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalFiles,
      totalKeywords,
      totalFolders,
      totalGroups,
      recentFiles,
      topKeywords,
    ] = await Promise.all([
      prisma.file.count(),
      prisma.keyword.count(),
      prisma.folder.count(),
      prisma.group.count(),
      prisma.file.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
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

    const emptyGroups = await prisma.group.count({
      where: {
        AND: [
          { files: { none: {} } },
          { children: { none: {} } },
          { keywords: { none: {} } },
        ],
      },
    });

    return NextResponse.json({
      totalFiles,
      totalKeywords,
      totalFolders,
      totalGroups,
      recentFiles,
      filesWithoutKeywords,
      unusedKeywords,
      emptyFolders,
      emptyGroups,
      topKeywords: topKeywords.map((keyword) => ({
        id: keyword.id,
        name: keyword.name,
        fileCount: keyword._count.files,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal session error" },
      { status: 500 }
    );
  }
}
