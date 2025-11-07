import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const groups = await prisma.keywordGroup.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      keywords: {
        include: { keyword: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const map = new Map<string, any>();
  const roots: any[] = [];

  groups.forEach((g) => {
    map.set(g.id, { ...g, children: [] });
  });

  map.forEach((group) => {
    if (group.parentId) {
      const parent = map.get(group.parentId);
      if (parent) {
        parent.children.push(group);
      } else {
        console.warn("⚠️ Missing parent:", group.name);
        roots.push(group); 
      }
    } else {
      roots.push(group);
    }
  });

  return NextResponse.json(roots);
}

// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getFullGroupHierarchy } from "@/lib/libs/keywordGroups";

// export async function GET() {
//   const groups = await getFullGroupHierarchy();
//   return NextResponse.json(groups);
// }
