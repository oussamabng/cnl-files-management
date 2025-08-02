// /app/api/chatroom/[roomId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getSessionUser } from "@/lib/auth/session/getUserSession";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const response = await requireApiPermission(PERMISSIONS.CHAT_VIEW);
  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }

  const { roomId } = await params;

  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { deletedAt: true },
    });

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          message: "Salle de discussion introuvable",
        },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: roomId,
        ...(room.deletedAt && {
          createdAt: {
            gte: room.deletedAt,
          },
        }),
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        status: 204,
        data: null,
      });
    }

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération des messages",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const response = await requireApiPermission(PERMISSIONS.CHAT_DELETE);
  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "non autorisé" },
      { status: 401 }
    );
  }
  const { roomId } = params;

  try {
    const existingRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 });
    }
    const isParticipant = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        participants: {
          some: { id: user?.id },
        },
      },
    });

    if (!isParticipant) {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }

    const room = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération des messages",
      },
      { status: 500 }
    );
  }
}
