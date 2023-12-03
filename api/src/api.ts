import express from "express";
import { createServer, Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import * as RoomStateManager from "./roomStateManager"; // Import the state manager

const app: express.Application = express();
const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server);

const apiNamespace = io.of("/api");

apiNamespace.on("connection", (socket: Socket) => {
  const userId = socket.id;

  socket.emit("user_socket_id", socket.id);
  broadcastServerStatus();

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);

    const roomState = RoomStateManager.getRoomState(roomName);
    socket.emit("room_state", roomState || []);
  });

  socket.on("leave_room", (roomName) => {
    socket.leave(roomName);
    console.log(`User left room: ${roomName}`);
  });

  socket.on("user_action", (msg) => {
    const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);

    console.log(`Pushing msg in room ${roomName}:`, msg);
    const fragment: RoomStateManager.RoomStateFragment = msg;

    if (roomName) {
      RoomStateManager.setRoomStateFragment(roomName, userId, fragment);
      broadcastRoom(roomName);
    }
  });

  socket.on("disconnecting", () => {
    RoomStateManager.purgeUser(userId);
    console.log("user disconnecting");

    const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (roomName) {
      broadcastRoom(roomName);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    broadcastServerStatus();
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});

function broadcastServerStatus() {
  apiNamespace.emit("server_status", getServerStatus());
}

function getServerStatus() {
  return {
    moderator: "Tester",
    numConnected: apiNamespace.sockets.size,
  };
}

function broadcastRoom(roomName: string) {
  const roomState = RoomStateManager.getRoomState(roomName);
  if (roomState) {
    console.log("Broadcasting room state: ", roomState);
    apiNamespace.to(roomName).emit("room_state", roomState);
  }
}
