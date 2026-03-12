import { ConnectionStatus, type RoomStateFragment, type ScratchboardState } from "@/domain/types";
import router from "@/router";
import { useContextStore } from "@/stores/contextStore";
import { useScheduleStore, type ScheduleItem } from "@/stores/scheduleStore";
import { defineStore } from "pinia";
import { Socket, io } from "socket.io-client";

let socket: Socket;

export const useSocketStore = defineStore("socket", {
  state: () => ({
    status: ConnectionStatus.Disconnected,
    currentRoom: undefined as string | undefined,
    scratchboard: new Map() as Map<string, ScratchboardState>,
    rooms: new Map() as Map<string, RoomStateFragment[]>,
    roster: new Map() as Map<string, string>,
    userId: undefined as string | undefined,
    moderatorUserId: undefined as string | undefined,
    numConnected: undefined as number | undefined,
    playSounds: true as boolean | undefined,
    sessionPin: null as string | null,
    hasPin: false,
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
      const storedPin = sessionStorage.getItem("sessionPin");
      socket = io("/", {
        path: "/api/socket.io",
        auth: storedPin ? { pin: storedPin } : {},
      });
      socket.on("connect", () => {
        this.status = ConnectionStatus.Connected;
      });

      socket.on("user_socket_id", (userId) => {
        this.userId = userId;
      });

      socket.on("move_room", (roomName) => {
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

      socket.on("all_room_state", (allRooms) => {
        allRooms.forEach((v: any) => this.rooms.set(v[0], v[1]));
      });

      socket.on("drumroll_play", (file) => {
        const audioPlayer = new Audio(file);
        audioPlayer.volume = 0.5;
        audioPlayer.play();
      });

      socket.on("disconnect", () => {
        if (this.status !== ConnectionStatus.PinRequired) {
          this.status = ConnectionStatus.Disconnected;
        }
        this.numConnected = undefined;
      });

      socket.on("reconnect_attempt", () => {
        this.status = ConnectionStatus.Reconnecting;
        this.numConnected = undefined;
      });

      socket.on("connect_error", (err) => {
        if (err.message === "PIN_REQUIRED") {
          this.status = ConnectionStatus.PinRequired;
          sessionStorage.removeItem("sessionPin");
          socket.disconnect();
          return;
        }
        this.status = ConnectionStatus.Error;
        this.numConnected = undefined;
      });

      socket.on("pin_changed", () => {
        sessionStorage.removeItem("sessionPin");
        this.sessionPin = null;
        this.status = ConnectionStatus.PinRequired;
        socket.disconnect();
      });

      socket.on("session_pin", (pin: string) => {
        this.sessionPin = pin;
        sessionStorage.setItem("sessionPin", pin);
      });

      socket.on("server_status", (serverStatus) => {
        const roster = new Map<string, string>(Object.entries(serverStatus.roster));

        this.roster = roster;
        this.moderatorUserId = serverStatus.moderatorUserId;
        this.numConnected = serverStatus.numConnected;
        this.playSounds = serverStatus.playSounds;
        this.hasPin = serverStatus.hasPin;

        if (!serverStatus.hasPin) {
          this.sessionPin = null;
          sessionStorage.removeItem("sessionPin");
        }
      });

      socket.on("schedule_update", (schedule) => {
        const scheduleStore = useScheduleStore();
        scheduleStore.setSchedule(schedule);
      });

      socket.on("room_state", (roomState) => {
        if (!this.currentRoom) {
          return;
        }

        this.rooms.set(this.currentRoom, roomState);
      });

      socket.on("scratchboard_update", (scratchboard) => {
        this.scratchboard = new Map<string, ScratchboardState>(scratchboard);
      });
    },

    updateName(name: string | undefined) {
      socket.emit("update_name", name);
    },

    claimModeration() {
      socket.emit("claim_moderation");
    },

    stopModeration() {
      socket.emit("stop_moderation", name);
    },

    updateSchedule(schedule: ScheduleItem[]) {
      socket.emit("update_schedule", schedule);
    },

    emitNamed(name: string, value?: any) {
      socket.emit(name, value);
    },

    scratchboardUpdate(roomId: string, text: string) {
      socket.emit("update_scratchboard", roomId, text);
    },

    joinRoom(roomName: string) {
      if (this.currentRoom) {
        socket.emit("leave_room", this.currentRoom);
      }
      this.currentRoom = roomName;
      socket.emit("join_room", roomName);
    },

    leaveRoom() {
      if (this.currentRoom) {
        socket.emit("leave_room", this.currentRoom);
        this.currentRoom = undefined;
      }
    },

    emitEvent(event: RoomStateFragment) {
      const contextStore = useContextStore();
      if (contextStore.silentSignals) {
        event.silent = true;
      }
      socket.emit("user_action", event);
    },

    async submitPin(pin: string): Promise<boolean> {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        return false;
      }
      sessionStorage.setItem("sessionPin", pin);
      socket.auth = { pin };
      socket.connect();
      return true;
    },

    setPin() {
      socket.emit("set_pin");
    },

    clearPin() {
      socket.emit("clear_pin");
    },

    resetSession() {
      socket.emit("reset_session");
    },

    getRoomState(room: string) {
      return this.rooms.get(room);
    },
  },
});
