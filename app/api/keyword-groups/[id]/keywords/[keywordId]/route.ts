import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; keywordId: string } }
) {
  try {
    const groupId = params.id;
    const keywordId = params.keywordId;

    console.log("[DELETE] Request received:", { groupId, keywordId });

    if (!groupId || !keywordId) {
      console.log("[DELETE] Missing parameters:", { groupId, keywordId });
      return NextResponse.json(
        { error: "groupId and keywordId are required" },
        { status: 400 }
      );
    }

    // Delete the join table entry
    await prisma.keywordGroupKeyword.deleteMany({
      where: {
        groupId,
        keywordId,
      },
    });

    console.log("[DELETE] Keyword successfully removed from group", {
      groupId,
      keywordId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
