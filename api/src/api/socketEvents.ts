import { Socket, Server as SocketIOServer } from "socket.io";
import { RoomStateFragment, RoomStateManager } from "../data/roomStateManager";

let moderator: string | undefined = undefined;
let moderatorUserId: string | undefined = undefined;

let lockedRooms = new Set<string>();

/* Kick off with a sample schedule */
let schedule: any[] = [
  {
    title: "AER-1234",
    code: "aer-1234",
    description: "example item 1",
    groupTitle: "Group 1",
    locked: false,
  },
  {
    title: "AER-1235",
    code: "aer-1235",
    description: "example item 2",
    groupTitle: "Group 1",
    locked: false,
  },
  {
    title: "AER-1236",
    code: "aer-1236",
    description: "example item 3",
    groupTitle: "Group 2",
    locked: false,
  },
];

/*
interface ScheduleItem {
  title: string;
  code: string;
  description?: string;
  groupTitle?: string;
  locked?: boolean;
  size?: number;
}
*/

let playSounds = true;

const drumrolls = [
  "/drumroll-1-low.mp3",
  "/drumroll-2-mid.mp3",
  "/fx-wait.mp3",
  "/jeopardy-fade.mp3",
  "/phone-ringing-marimba.mp3",
  "/sonido-de-siguiente.mp3",
  "/tarot-shuffle.mp3",
];
let drumrollType = "random";

export function setupSocketEvents(io: SocketIOServer) {
  const path = "/";
  console.log(`Setting up socket on ${path}`);

  const apiNamespace = io.of(path);

  const roomTimers = new Map();

  const roomStateManager = new RoomStateManager();

  apiNamespace.on("connection", (socket: Socket) => {
    const userId = socket.id;

    socket.emit("user_socket_id", socket.id);
    broadcastSchedule();
    broadcastServerStatus();

    socket.on("join_room", (roomName) => {
      socket.join(roomName);
      console.log(`User joined room: ${roomName}`);

      const roomState = roomStateManager.getRoomState(roomName);
      socket.emit("room_state", roomState || []);

      handleBroadcastSchedule(roomName);
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
        roomStateManager.purgeSignal(roomName);
        broadcastRoom(roomName);
      }
    });
    socket.on("fetch_all_room_state", () => {
      const fullRoomState = Array.from(roomStateManager.roomKeys()).map((v) => [
        v,
        roomStateManager.getRoomState(v),
      ]);
      socket.emit("all_room_state", fullRoomState);
    });
    socket.on("reset_room_poker", () => {
      if (moderatorUserId !== userId) {
        return;
      }

      const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (roomName) {
        roomStateManager.purgePoker(roomName);
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

    socket.on("persist_drumroll", (type) => {
      if (moderatorUserId !== userId) {
        return;
      }

      console.log("Changing drumroll to: ", type);
      drumrollType = type;
    });

    socket.on("drumroll", () => {
      if (moderatorUserId !== userId) {
        return;
      }

      const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (roomName) {
        const file =
          drumrollType === "random"
            ? drumrolls[Math.floor(Math.random() * drumrolls.length)]
            : drumrollType;

        console.log("Sending drumroll play: ", drumrollType, file);
        apiNamespace.to(roomName).emit("drumroll_play", "/drumrolls" + file);
      }
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

    socket.on("mute_sounds_toggle", () => {
      playSounds = !playSounds;
      broadcastServerStatus();
    });

    socket.on("leave_room", (roomName) => {
      socket.leave(roomName);

      handleBroadcastSchedule(roomName);
    });

    socket.on("user_action", (msg) => {
      const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (roomName && isRoomLocked(roomName)) {
        return;
      }

      const fragment: RoomStateFragment = msg;

      if (roomName) {
        roomStateManager.setRoomStateFragment(roomName, userId, fragment);
        broadcastRoom(roomName);
      }
    });

    socket.on("disconnecting", () => {
      roomStateManager.purgeUser(userId, lockedRooms);

      const roomName = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (roomName) {
        broadcastRoom(roomName);
      }

      if (moderatorUserId === userId) {
        clearModerator();
      }
    });

    socket.on("disconnect", () => {
      broadcastServerStatus();
    });
  });

  function handleBroadcastSchedule(roomName: string) {
    if (!roomTimers.has(roomName)) {
      broadcastSchedule();

      const timer = setTimeout(() => {
        broadcastSchedule();
        roomTimers.delete(roomName);
      }, 1000);

      roomTimers.set(roomName, timer);
    }
  }

  function isRoomLocked(room: string) {
    return lockedRooms.has(room);
  }

  function broadcastSchedule() {
    schedule.forEach((item) => {
      const room = io.sockets.adapter.rooms.get(item.code);
      const userCount = room ? room.size : 0;
      item.size = userCount;

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
      playSounds: playSounds,
    };
  }

  function broadcastRoom(roomName: string) {
    const roomState = roomStateManager.getRoomState(roomName);
    if (roomState) {
      apiNamespace.to(roomName).emit("room_state", roomState);
    }
  }
}
