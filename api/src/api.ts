import express from "express";
import { createServer, Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

const app: express.Application = express();
const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server);

const apiNamespace = io.of("/api");

apiNamespace.on("connection", (socket: Socket) => {
  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
    console.log(`User left room: ${roomName}`);
  });

  socket.on("buttonPressEvent", (event) => {
    const room = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (room) {
      apiNamespace.to(room).emit("buttonPressEvent", event);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
