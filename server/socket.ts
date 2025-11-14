import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export function initializeSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer);

  io.on("connection", (socket) => {
    socket.send("hello");
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
