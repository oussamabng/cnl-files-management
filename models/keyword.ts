import { prisma } from "@/lib/prisma";

export async function getAllKeywords() {
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

  const formattedKeywords = keywords.map((kw) => {
    const groups =
      kw.groupLinks?.map((gl) => ({
        id: gl.group.id,
        name: gl.group.name,
      })) || [];

    return {
      id: kw.id,
      name: kw.name,
      groups,
      filesCount: kw._count?.files ?? 0,
    };
  });

  return formattedKeywords;
}
