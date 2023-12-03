import express from "express";
import { createServer, Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import * as RoomStateManager from "./roomStateManager"; // Import the state manager

const app: express.Application = express();
const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server);

let moderator: string | undefined = undefined;
let moderatorUserId: string | undefined = undefined;

let lockedRooms = new Set();
let schedule: any[] = [];

const apiNamespace = io.of("/");

apiNamespace.on("connection", (socket: Socket) => {
  const userId = socket.id;

  socket.emit("user_socket_id", socket.id);
  broadcastSchedule();
  broadcastServerStatus();

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);

    const roomState = RoomStateManager.getRoomState(roomName);
    socket.emit("room_state", roomState || []);
  });
  socket.on("everyone_to_moderator", () => {
    if (moderatorUserId !== userId) {
      return;
    }

    const moderatorRoomName = Array.from(socket.rooms).find((r) => r !== moderatorUserId);
    apiNamespace.emit("move_room", moderatorRoomName);
  });

  socket.on("claim_moderation", (name) => {
    moderator = name;
    moderatorUserId = userId;
    broadcastServerStatus();
  });

  socket.on("stop_moderation", () => {
    if (moderatorUserId === userId) {
      clearModerator();
    }
  });

  socket.on("reset_room_signals", () => {
    if (moderatorUserId !== userId) {
      return;
    }

    const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (roomName) {
      console.log("Purging: " + roomName);
      RoomStateManager.purgeSignal(roomName);
      broadcastRoom(roomName);
    }
  });
  socket.on("reset_room_poker", () => {
    if (moderatorUserId !== userId) {
      return;
    }

    const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (roomName) {
      RoomStateManager.purgePoker(roomName);
      broadcastRoom(roomName);
    }
  });

  socket.on("update_schedule", (arr) => {
    if (moderatorUserId !== userId) {
      return;
    }

    schedule = arr;
    broadcastSchedule();
  });

  socket.on("lock_room", () => {
    if (moderatorUserId !== userId) {
      return;
    }

    const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (roomName) {
      lockedRooms.add(roomName);
      broadcastSchedule();
    }
  });

  socket.on("lock_room_toggle", () => {
    if (moderatorUserId !== userId) {
      return;
    }

    const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (roomName) {
      if (lockedRooms.has(roomName)) {
        lockedRooms.delete(roomName);
      } else {
        lockedRooms.add(roomName);
      }
      broadcastSchedule();
    }
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

    if (moderatorUserId === userId) {
      clearModerator();
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

function broadcastSchedule() {
  schedule.forEach((item) => {
    if (lockedRooms.has(item.code)) {
      item.locked = true;
    } else {
      item.locked = false;
    }
  });
  apiNamespace.emit("schedule_update", schedule);
}

function broadcastServerStatus() {
  apiNamespace.emit("server_status", getServerStatus());
}

function clearModerator() {
  moderatorUserId = undefined;
  moderator = undefined;
  broadcastServerStatus();
}

function getServerStatus() {
  return {
    moderator: moderator,
    moderatorUserId: moderatorUserId,
    numConnected: apiNamespace.sockets.size,
  };
}

function broadcastRoom(roomName: string) {
  const roomState = RoomStateManager.getRoomState(roomName);
  if (roomState) {
    apiNamespace.to(roomName).emit("room_state", roomState);
  }
}
