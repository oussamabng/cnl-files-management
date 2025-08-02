import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNowStrict } from "date-fns";
import { getSessionUser } from "@/lib/auth/session/getUserSession";

export async function GET(req: NextRequest) {
  const response = await requireApiPermission(PERMISSIONS.CHAT_VIEW);
  if (!response.success) {
    return NextResponse.json(
      { error: response.error, message: response.message },
      { status: response.status }
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { message: "utilisateur non connecté" },
      { status: 400 }
    );
  }
  const rooms = await prisma.chatRoom.findMany({
    where: {
      participants: {
        some: {
          id: user.id,
        },
      },
    },
    include: {
      participants: true,
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  if (!rooms) {
    return NextResponse.json({
      message: "Erreur lors de la récupération des salons de discussion",
      status: 500,
    });
  }
  if (rooms.length === 0) {
    return NextResponse.json({
      message: "Aucun salon de discussion trouvé",
      status: 500,
    });
  }
  const formatted = rooms.map((room) => {
    const lastMessage = room.messages[0];
    const otherParticipant = room.participants.find((p) => p.id !== user.id);

    return {
      id: room.id,
      name: `${otherParticipant?.firstName ?? "Unknown"} ${
        otherParticipant?.lastName ?? ""
      }`,
      lastMessageSnippet: lastMessage?.content || "No messages yet",
      lastMessageTime: lastMessage
        ? formatDistanceToNowStrict(new Date(lastMessage.createdAt), {
            addSuffix: true,
          })
        : "",
    };
  });

  return NextResponse.json({ success: true, data: formatted });
}
