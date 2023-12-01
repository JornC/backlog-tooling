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

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
