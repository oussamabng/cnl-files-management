import { prisma } from "../prisma";

export async function getOneToOneChatRoom(userAId: string, userBId: string) {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      participants: {
        some: { id: userAId },
      },
      AND: {
        participants: {
          some: { id: userBId },
        },
      },
    },
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  return rooms.find((r) => r._count.participants === 2) || null;
}
