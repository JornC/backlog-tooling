import { ConnectionStatus, type RoomStateFragment } from "@/domain/types";
import { defineStore } from "pinia";
import { Socket, io } from "socket.io-client";

class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = null as unknown as Socket;
  }

  initialize() {
    this.socket = io("http://localhost:8080/api", { path: "/api/socket.io" });
  }

  get() {
    return this.socket;
  }
}

const socket = new SocketService();

export const useSocketStore = defineStore("socket", {
  state: () => ({
    status: ConnectionStatus.Disconnected,
    currentRoom: undefined as string | undefined,
    rooms: new Map() as Map<string, RoomStateFragment[]>,
    moderator: undefined as String | undefined,
    numConnected: undefined as number | undefined,
  }),

  actions: {
    initializeSocket() {
      socket.initialize();
      socket.get().on("connect", () => {
        this.status = ConnectionStatus.Connected;
      });

      socket.get().on("disconnect", () => {
        this.status = ConnectionStatus.Disconnected;
        this.numConnected = undefined;
      });

      socket.get().on("reconnect_attempt", () => {
        this.status = ConnectionStatus.Reconnecting;
        this.numConnected = undefined;
      });

      socket.get().on("connect_error", () => {
        this.status = ConnectionStatus.Error;
        this.numConnected = undefined;
      });

      socket.get().on("server_status", (serverStatus) => {
        console.log("Got server status: ", serverStatus);
        this.moderator = serverStatus.moderator;
        this.numConnected = serverStatus.numConnected;
      });

      socket.get().on("room_state", (roomState) => {
        if (!this.currentRoom) {
          return;
        }

        console.log(roomState);
        this.rooms.set(this.currentRoom, roomState);
      });
    },

    joinRoom(roomName: string) {
      if (this.currentRoom) {
        socket.get().emit("leave_room", this.currentRoom);
      }
      this.currentRoom = roomName;
      socket.get().emit("join_room", roomName);
    },

    leaveRoom() {
      if (this.currentRoom) {
        socket.get().emit("leave_room", this.currentRoom);
        this.currentRoom = undefined;
      }
    },

    emitEvent(event: RoomStateFragment) {
      socket.get().emit("user_action", event);
    },

    getRoomState(room: string) {
      return this.rooms.get(room);
    },
  },
});
