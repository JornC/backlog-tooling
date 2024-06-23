import { ConnectionStatus, type RoomStateFragment } from "@/domain/types";
import router from "@/router";
import { useScheduleStore, type ScheduleItem } from "@/stores/scheduleStore";
import { defineStore } from "pinia";
import { Socket, io } from "socket.io-client";

class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = null as unknown as Socket;
  }

  initialize() {
    this.socket = io("/", { path: "/api/socket.io" });
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
    roster: new Map() as Map<string, string>,
    userId: undefined as string | undefined,
    moderatorUserId: undefined as string | undefined,
    numConnected: undefined as number | undefined,
    playSounds: true as boolean | undefined,
  }),

  getters: {
    isModerator: (state) => state.userId !== undefined && state.userId === state.moderatorUserId,
    isIdentified: (state) => state.userId !== undefined && state.roster.has(state.userId),
    moderator: (state) =>
      state.moderatorUserId ? state.roster.get(state.moderatorUserId) ?? undefined : undefined,
    name: (state) => state.roster.get(state.userId!) ?? undefined,
  },

  actions: {
    initializeSocket() {
      socket.initialize();
      socket.get().on("connect", () => {
        this.status = ConnectionStatus.Connected;
      });

      socket.get().on("user_socket_id", (userId) => {
        this.userId = userId;
      });

      socket.get().on("move_room", (roomName) => {
        if (
          router.currentRoute.value.name !== "AgendaRoute" ||
          router.currentRoute.value.params.code !== roomName
        ) {
          const audioPlayer = new Audio("/swoosh.mp3");
          audioPlayer.volume = 0.5;
          audioPlayer.play();
        }
        router.push({ name: "AgendaRoute", params: { code: roomName } });
      });

      socket.get().on("all_room_state", (allRooms) => {
        allRooms.forEach((v: any) => this.rooms.set(v[0], v[1]));
      });

      socket.get().on("drumroll_play", (file) => {
        const audioPlayer = new Audio(file);
        audioPlayer.volume = 0.5;
        audioPlayer.play();
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
        const roster = new Map<string, string>(Object.entries(serverStatus.roster));

        this.roster = roster;
        this.moderatorUserId = serverStatus.moderatorUserId;
        this.numConnected = serverStatus.numConnected;
        this.playSounds = serverStatus.playSounds;
      });

      socket.get().on("schedule_update", (schedule) => {
        const scheduleStore = useScheduleStore();
        scheduleStore.setSchedule(schedule);
      });

      socket.get().on("room_state", (roomState) => {
        if (!this.currentRoom) {
          return;
        }

        this.rooms.set(this.currentRoom, roomState);
      });
    },

    updateName(name: string | undefined) {
      socket.get().emit("update_name", name);
    },

    claimModeration() {
      socket.get().emit("claim_moderation");
    },

    stopModeration() {
      socket.get().emit("stop_moderation", name);
    },

    updateSchedule(schedule: ScheduleItem[]) {
      socket.get().emit("update_schedule", schedule);
    },

    emitNamed(name: string, value?: any) {
      socket.get().emit(name, value);
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
