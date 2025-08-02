import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string; messageId: string } }
) {
  const response = await requireApiPermission(
    [PERMISSIONS.MESSAGE_DELETE, PERMISSIONS.CHAT_VIEW],
    "and"
  );
  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }

  const { roomId, messageId } = params;

  try {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.chatRoomId !== roomId) {
      return NextResponse.json(
        { success: false, message: "Message introuvable" },
        { status: 404 }
      );
    }
    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, message: "Message supprimé" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Erreur lors de la suppression du message" },
      { status: 500 }
    );
  }
}
