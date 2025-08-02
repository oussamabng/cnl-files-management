import { Message } from "@/lib/generated/prisma";

export type MessageWithSender = Message & {
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};
