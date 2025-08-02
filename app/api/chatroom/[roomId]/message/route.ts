import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getSessionUser } from "@/lib/auth/session/getUserSession";

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const response = await requireApiPermission(PERMISSIONS.MESSAGE_SEND);
  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }
  const { roomId } = params;
  const user = await getSessionUser();
  const body = await req.json();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "non autorisé" },
      { status: 401 }
    );
  }

  const { content } = body;

  if (!content) {
    return NextResponse.json(
      { success: false, message: "Le message est vide" },
      { status: 400 }
    );
  }

  try {
    const message = await prisma.message.create({
      data: {
        chatRoomId: roomId,
        senderId: user.id,
        content,
      },
    });
    if (!message) {
      return NextResponse.json({
        success: false,
        message: "Erreur lors de la création du message",
      });
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Erreur lors de la création du message" },
      { status: 500 }
    );
  }
}
