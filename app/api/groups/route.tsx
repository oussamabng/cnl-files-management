/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";

async function getDescendantGroupIds(groupId: string): Promise<string[]> {
  const children = await prisma.group.findMany({
    where: { parentId: groupId },
    select: { id: true },
  });

  let allDescendants = children.map((child) => child.id);

  for (const child of children) {
    const grandChildren = await getDescendantGroupIds(child.id);
    allDescendants = [...allDescendants, ...grandChildren];
  }

  return allDescendants;
}

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
    const parentId = searchParams.get("parentId") || null;
    const includeKeywords = searchParams.get("includeKeywords") === "true";
    const includeHierarchy = searchParams.get("includeHierarchy") === "true";

    if (includeHierarchy) {
      const group = await prisma.group.findMany({
        orderBy: {
          name: "asc",
        },
      });

      const GroupsWithCounts = await Promise.all(
        group.map(async (group) => {
          const descendantIds = await getDescendantGroupIds(group.id);
          const allGroupIds = [group.id, ...descendantIds];

          const totalKeywords = await prisma.keyword.count({
            where: {
              groups: {
                some: {
                  id: { in: allGroupIds },
                },
              },
            },
          });

          const totalFiles = await prisma.file.count({
            where: {
              groups: {
                some: {
                  id: { in: allGroupIds },
                },
              },
            },
          });

          const directChildren = await prisma.group.count({
            where: { parentId: group.id },
          });

          const totalGroups = descendantIds.length;

          return {
            ...group,
            _count: {
              children: directChildren,
              keywords: totalKeywords,
              groups: totalGroups,
              files: totalFiles,
            },
          };
        })
      );

      return NextResponse.json(GroupsWithCounts);
    }

    const groups = await prisma.group.findMany({
      where: {
        parentId: parentId,
      },
      include: {
        ...(includeKeywords && {
          keywords: {
            select: {
              id: true,
              name: true,
            },
          },
        }),
      },
      orderBy: {
        name: "asc",
      },
    });

    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const descendantIds = await getDescendantGroupIds(group.id);
        const allGroupIds = [group.id, ...descendantIds];

        const totalKeywords = await prisma.keyword.count({
          where: {
            groups: {
              some: {
                id: { in: allGroupIds },
              },
            },
          },
        });

        const totalFiles = await prisma.file.count({
          where: {
            groups: {
              some: {
                id: { in: allGroupIds },
              },
            },
          },
        });

        const directChildren = await prisma.group.count({
          where: { parentId: group.id },
        });

        const totalGroups = descendantIds.length;

        return {
          ...group,
          _count: {
            children: directChildren,
            keywords: totalKeywords,
            group: totalGroups,
            files: totalFiles,
          },
        };
      })
    );

    return NextResponse.json(groupsWithCounts);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const { error } = await requireApiPermission(PERMISSIONS.FILTERS_CREATE);
    if (error) return error;

    const { name, parentId } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du dossier est requis" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentGroup = await prisma.group.findUnique({
        where: { id: parentId },
      });
      if (!parentGroup) {
        return NextResponse.json(
          { error: "Dossier parent introuvable" },
          { status: 404 }
        );
      }
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
    });

    const descendantIds = await getDescendantGroupIds(group.id);
    const allGroupIds = [group.id, ...descendantIds];
    const totalKeywords = await prisma.keyword.count({
      where: {
        groups: {
          some: {
            id: { in: allGroupIds },
          },
        },
      },
    });

    const directChildren = await prisma.group.count({
      where: { parentId: group.id },
    });

    const totalGroups = descendantIds.length;

    return NextResponse.json({
      ...group,
      _count: {
        children: directChildren,
        keywords: totalKeywords,
        groups: totalGroups,
      },
    });
  } catch (error: any) {
    console.error("Error creating group:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un group avec ce nom existe déjà à cet emplacement" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
