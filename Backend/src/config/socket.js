import { Server } from "socket.io";
import env from "./env.js";

let io = null;

/* ---------- Initialize socket server ---------- */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Frontend connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Frontend disconnected:", socket.id);
    });
  });

  return io;
};

/* ---------- Getter (used in services) ---------- */
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
