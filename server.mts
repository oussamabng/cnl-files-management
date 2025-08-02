import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { prisma } from "./lib/prisma"; // Adjust path as needed

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Replace with your actual frontend URL
    credentials: true,
  },
});

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Authenticate socket via JWT in cookie
io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error("No cookies found"));

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies["auth-token"];
    if (!token) return next(new Error("No auth-token cookie"));

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    socket.data.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log(`✅ User connected: ${userId} (socket ${socket.id})`);

  // JOIN ROOM
  socket.on("joinRoom", async ({ roomId }: { roomId: string }) => {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { participants: true },
      });

      if (!room) return socket.emit("error", "Room not found");

      const isParticipant = room.participants.some((p) => p.id === userId);
      if (!isParticipant) return socket.emit("error", "Access denied");

      socket.join(roomId);
      console.log(`📥 User ${userId} joined room ${roomId}`);
    } catch (err) {
      console.error("joinRoom error:", err);
    }
  });

  // LEAVE ROOM
  socket.on("leaveRoom", ({ roomId }: { roomId: string }) => {
    socket.leave(roomId);
    console.log(`📤 User ${userId} left room ${roomId}`);
  });

  // SEND MESSAGE
  socket.on(
    "message:send",
    async ({ roomId, content }: { roomId: string; content: string }) => {
      try {
        const room = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: { participants: true },
        });

        if (!room) return socket.emit("error", "Room not found");

        const isParticipant = room.participants.some((p) => p.id === userId);
        if (!isParticipant) return socket.emit("error", "Access denied");

        const message = await prisma.message.create({
          data: {
            content,
            room: { connect: { id: roomId } },
            sender: { connect: { id: userId } },
          },
          include: { sender: true },
        });

        io.to(roomId).emit("message:new", {
          id: message.id,
          content: message.content,
          sender: {
            id: message.sender.id,
            name: `${message.sender.firstName} ${message.sender.lastName}`,
          },
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error("message:send error:", err);
      }
    }
  );

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId} (socket ${socket.id})`);
  });
});

app.prepare().then(() => {
  httpServer.on("request", handle);
  httpServer.listen(3001, () => {
    console.log("🚀 Socket.IO server running at http://localhost:3001");
  });
});
