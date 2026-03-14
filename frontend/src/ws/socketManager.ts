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
    moderatorReconnecting: false,
    moderatorGraceName: undefined as string | undefined,
    numConnected: undefined as number | undefined,
    playSounds: true as boolean | undefined,
    sessionPin: null as string | null,
    hasPin: false,
    sessionEmails: [] as string[],
  }),

  getters: {
    isModerator: (state) => state.userId !== undefined && state.userId === state.moderatorUserId,
    isIdentified: (state) => state.userId !== undefined && state.roster.has(state.userId),
    moderator: (state) =>
      state.moderatorUserId ? state.roster.get(state.moderatorUserId) ?? undefined : undefined,
    moderatorDisplayName: (state) =>
      state.moderatorUserId
        ? state.roster.get(state.moderatorUserId) ?? undefined
        : state.moderatorReconnecting
          ? state.moderatorGraceName
          : undefined,
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
        const storedName = localStorage.getItem("moderatorName");
        if (storedName) {
          socket.emit("update_name", storedName);
        }
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

      socket.on("session_ended", () => {
        this.status = ConnectionStatus.SessionEnded;
        sessionStorage.removeItem("sessionPin");
      });

      socket.on("disconnect", () => {
        if (
          this.status !== ConnectionStatus.PinRequired &&
          this.status !== ConnectionStatus.SessionEnded
        ) {
          this.status = ConnectionStatus.Disconnected;
        }
        this.numConnected = undefined;
        this.currentRoom = undefined;
        this.scratchboard = new Map();
        this.rooms = new Map();
        this.roster = new Map();
        this.moderatorUserId = undefined;
        this.moderatorReconnecting = false;
        this.moderatorGraceName = undefined;
        this.sessionEmails = [];
        const scheduleStore = useScheduleStore();
        scheduleStore.setSchedule([]);
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

      socket.on("session_emails", (emails: string[]) => {
        this.sessionEmails = emails;
        localStorage.setItem("sessionEmails", JSON.stringify(emails));
      });

      socket.on("server_status", (serverStatus) => {
        const roster = new Map<string, string>(Object.entries(serverStatus.roster));

        this.roster = roster;
        this.moderatorUserId = serverStatus.moderatorUserId;
        this.moderatorReconnecting = serverStatus.moderatorReconnecting;
        this.moderatorGraceName = serverStatus.moderatorGraceName;
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
      const emails = this.getStoredSessionEmails();
      socket.emit("claim_moderation", emails.length > 0 ? emails : undefined);
      const drumroll = localStorage.getItem("drumrollSelection");
      if (drumroll) {
        socket.emit("persist_drumroll", drumroll);
      }
      const storedPin = sessionStorage.getItem("sessionPin");
      if (storedPin) {
        this.sessionPin = storedPin;
      }
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

    updateSessionEmails(emails: string[]) {
      socket.emit("update_session_emails", emails);
    },

    getStoredSessionEmails(): string[] {
      const stored = localStorage.getItem("sessionEmails");
      if (stored) {
        return JSON.parse(stored);
      }
      // Migration: seed from old moderatorEmail key
      const legacy = localStorage.getItem("moderatorEmail");
      if (legacy) {
        const emails = [legacy];
        localStorage.setItem("sessionEmails", JSON.stringify(emails));
        return emails;
      }
      return [];
    },

    resetSession() {
      socket.emit("reset_session");
    },

    getRoomState(room: string) {
      return this.rooms.get(room);
    },
  },
});
