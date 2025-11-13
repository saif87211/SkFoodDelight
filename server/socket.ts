import http from "http";
import { Server } from "socket.io";

export const socketEvents = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  ORDER_PREPARED: "order_prepared",
  ORDER_DELIVERED: "order_delivered",
  ORDER_INCOMING: "order_incoming",
};

export function intializeSocket(app: any) {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    pingTimeout: 60000,
  });

  io.on(socketEvents.CONNECTION, (socket) => {
    console.log("New client connected");

    socket.on(socketEvents.ORDER_PREPARED, (orderid: string) => {
      console.log("Order prepared:", orderid);
    });

    socket.on(socketEvents.ORDER_DELIVERED, (orderid: string) => {
      console.log("Order delivered:", orderid);
    });

    socket.on(socketEvents.DISCONNECT, () => {
      console.log("Client disconnected");
    });
  });

  return io;
}
