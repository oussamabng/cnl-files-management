import { prisma } from "@/lib/prisma";

export type Keyword = { id: string; name: string };
export type KeywordGroupNode = {
  id: string;
  name: string;
  parentId: string | null;
  keywords: Keyword[];
  children: KeywordGroupNode[];
};

export async function getFullGroupHierarchy(): Promise<KeywordGroupNode[]> {
  const groups = await prisma.keywordGroup.findMany({
    include: {
      keywords: { include: { keyword: true } },
    },
    orderBy: { name: "asc" },
  });

  const map = new Map<string, KeywordGroupNode>();
  const roots: KeywordGroupNode[] = [];

  const normalizedGroups: KeywordGroupNode[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    parentId: g.parentId,
    keywords: g.keywords.map((k) => ({
      id: k.keyword.id,
      name: k.keyword.name,
    })),
    children: [],
  }));

  normalizedGroups.forEach((g) => map.set(g.id, g));

  map.forEach((group) => {
    if (group.parentId) {
      const parent = map.get(group.parentId);
      if (parent) parent.children.push(group);
      else roots.push(group);
    } else {
      roots.push(group);
    }
  });

  return roots;
}

export function collectGroupIds(group: KeywordGroupNode): string[] {
  let ids = [group.id];
  group.children.forEach((child) => {
    ids = ids.concat(collectGroupIds(child));
  });
  return ids;
}

export function findGroupById(groups: any[], id: string): any | null {
  for (const group of groups) {
    if (group.id === id) return group;
    if (group.children.length > 0) {
      const found = findGroupById(group.children, id);
      if (found) return found;
    }
  }
  return null;
}

export async function getAllGroups(): Promise<
  Array<{
    id: string;
    name: string;
    parentId: string | null;
    depth: number;
    keywords: { id: string; name: string }[];
  }>
> {
  const hierarchy = await getFullGroupHierarchy();

  const flattenGroups = (
    nodes: KeywordGroupNode[],
    depth = 0
  ): Array<{
    id: string;
    name: string;
    parentId: string | null;
    depth: number;
    keywords: { id: string; name: string }[];
  }> =>
    nodes.flatMap((g) => {
      const current = {
        id: g.id,
        name: g.name,
        parentId: g.parentId ?? null,
        depth,
        keywords: g.keywords,
      };
      if (g.children?.length) {
        return [current, ...flattenGroups(g.children, depth + 1)];
      }
      return [current];
    });

  return flattenGroups(hierarchy);
}
