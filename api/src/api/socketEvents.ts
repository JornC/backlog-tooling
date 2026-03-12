import { Express } from "express";
import { Socket, Server as SocketIOServer } from "socket.io";
import { RoomStateFragment, RoomStateManager } from "../data/roomStateManager";
import { ScratchboardState } from "../data/scratchboardmanager";
import { sendSessionSummary } from "../email/sessionSummary";
import { postEstimatesToJira } from "../jira/postEstimates";

export function setupSocketEvents(io: SocketIOServer, app: Express) {
  let moderatorUserId: string | undefined = undefined;
  const sessionEmails = new Set<string>();

  let lockedRooms = new Set<string>();
  const lockedBy = new Map<string, string>();

  let sessionPin: string | undefined = undefined;
  let pinClearTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  function getDefaultSchedule() {
    return [
      {
        title: "AER-1234",
        code: "aer-1234",
        description: "This is a sample item. The moderator can replace this schedule.",
        groupTitle: "Example group",
        locked: false,
      },
      {
        title: "AER-1235",
        code: "aer-1235",
        description: "Another sample item to demonstrate the agenda.",
        groupTitle: "Example group",
        locked: false,
      },
    ];
  }

  let schedule: any[] = getDefaultSchedule();

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

  const roomTimers = new Map();

  const roomStateManager = new RoomStateManager();
  const roster = new Map();
  const scratchboard = new Map();

  function getUserRoom(socket: Socket): string | undefined {
    return Array.from(socket.rooms).find((r) => r !== socket.id);
  }

  const path = "/";
  const apiNamespace = io.of(path);

  // HTTP endpoint for PIN verification
  app.use("/api/verify-pin", (req, _res, next) => {
    // Parse JSON body manually since express.json() may not be registered
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        (req as any).body = JSON.parse(body);
      } catch {
        (req as any).body = {};
      }
      next();
    });
  });

  app.post("/api/verify-pin", (req, res) => {
    const pin = (req as any).body?.pin;
    if (!sessionPin || pin === sessionPin) {
      res.status(200).json({ ok: true });
    } else {
      res.status(401).json({ error: "Invalid PIN" });
    }
  });

  // PIN middleware - reject connections with wrong/missing PIN
  apiNamespace.use((socket, next) => {
    if (!sessionPin) {
      return next();
    }
    const pin = socket.handshake.auth?.pin;
    if (pin === sessionPin) {
      return next();
    }
    return next(new Error("PIN_REQUIRED"));
  });

  function clearPinTimer() {
    if (pinClearTimer) {
      clearTimeout(pinClearTimer);
      pinClearTimer = undefined;
    }
  }

  function getDefaultScheduleCodes() {
    return getDefaultSchedule().map((item) => item.code);
  }

  function startPinClearTimerIfNeeded() {
    if (!sessionPin) {
      return;
    }
    if (apiNamespace.sockets.size === 0) {
      console.log("All clients disconnected. Session auto-reset in 24h.");
      pinClearTimer = setTimeout(async () => {
        console.log("Session auto-reset triggered (no connections for 24h)");
        const jiraResults = await postEstimatesToJira(schedule, roomStateManager);
        await sendSessionSummary(
          schedule,
          getDefaultScheduleCodes(),
          roomStateManager,
          scratchboard,
          roster,
          lockedRooms,
          lockedBy,
          jiraResults,
          sessionEmails,
        );
        sessionPin = undefined;
        pinClearTimer = undefined;
        moderatorUserId = undefined;
        sessionEmails.clear();
        lockedRooms = new Set<string>();
        lockedBy.clear();
        schedule = getDefaultSchedule();
        playSounds = true;
        drumrollType = "random";
        Array.from(roomStateManager.roomKeys()).forEach((key: string) => {
          roomStateManager.purgeSignal(key);
          roomStateManager.purgePoker(key);
        });
        roster.clear();
        scratchboard.clear();
      }, 24 * 60 * 60_000);
    }
  }

  function disconnectNonModerator() {
    for (const [id, s] of apiNamespace.sockets) {
      if (id !== moderatorUserId) {
        s.emit("pin_changed");
      }
    }
  }

  apiNamespace.on("connection", (socket: Socket) => {
    clearPinTimer();
    console.log("Connection.");
    const userId = socket.id;

    socket.emit("user_socket_id", socket.id);
    broadcastSchedule();
    broadcastServerStatus();
    broadcastScratchboard();

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

      apiNamespace.emit("move_room", getUserRoom(socket));
    });

    socket.on("update_name", (name) => {
      if (!name && moderatorUserId === userId) {
        clearModerator(false);
      }

      if (name) {
        roster.set(userId, name);
      } else {
        roster.delete(userId);
      }
      broadcastServerStatus();
    });

    socket.on("claim_moderation", (email?: string) => {
      moderatorUserId = userId;
      if (email) {
        sessionEmails.add(email);
      }
      apiNamespace.emit("session_email_count", sessionEmails.size);
      broadcastServerStatus();
    });

    socket.on("register_email", (email: string) => {
      if (email) {
        sessionEmails.add(email);
        apiNamespace.emit("session_email_count", sessionEmails.size);
      }
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

      const roomName = getUserRoom(socket);
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

      const roomName = getUserRoom(socket);
      if (roomName) {
        roomStateManager.purgePoker(roomName);
        broadcastRoom(roomName);
      }
    });

    socket.on("update_scratchboard", (roomId, text) => {
      if (!scratchboard.has(roomId)) {
        scratchboard.set(roomId, {} as ScratchboardState);
      }

      if (lockedRooms.has(roomId)) {
        return;
      }

      const scratchboardState: ScratchboardState = scratchboard.get(roomId);
      if (!scratchboardState.typingUserId) {
        scratchboardState.typingUserId = userId;
      }

      if (scratchboardState.typingUserId === userId) {
        scratchboardState.text = text;
      }

      if (text === "") {
        scratchboardState.typingUserId = undefined;
      }

      // Reset the timer
      if (scratchboardState.timer) {
        clearTimeout(scratchboardState.timer);
      }

      scratchboardState.timer = setTimeout(() => {
        if (scratchboardState.typingUserId === userId) {
          scratchboardState.typingUserId = undefined;
          broadcastScratchboard();
        }
      }, 1200);

      broadcastScratchboard();
    });

    socket.on("update_schedule", (arr) => {
      if (moderatorUserId !== userId || !sessionPin) {
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

      const roomName = getUserRoom(socket);
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

      const roomName = getUserRoom(socket);
      if (roomName) {
        lockedRooms.add(roomName);
        lockedBy.set(roomName, roster.get(userId) || "Unknown");
        broadcastSchedule();
      }
    });

    socket.on("lock_room_toggle", () => {
      if (moderatorUserId !== userId) {
        return;
      }

      const roomName = getUserRoom(socket);
      if (roomName) {
        if (lockedRooms.has(roomName)) {
          lockedRooms.delete(roomName);
          lockedBy.delete(roomName);
        } else {
          lockedRooms.add(roomName);
          lockedBy.set(roomName, roster.get(userId) || "Unknown");
        }
        broadcastSchedule();
      }
    });

    socket.on("mute_sounds_toggle", () => {
      playSounds = !playSounds;
      broadcastServerStatus();
    });

    socket.on("set_pin", () => {
      if (moderatorUserId !== userId) {
        return;
      }
      sessionPin = String(Math.floor(1000 + Math.random() * 9000));
      socket.emit("session_pin", sessionPin);
      broadcastServerStatus();
      disconnectNonModerator();
    });

    socket.on("clear_pin", () => {
      if (moderatorUserId !== userId) {
        return;
      }
      sessionPin = undefined;
      clearPinTimer();
      broadcastServerStatus();
    });

    socket.on("reset_session", async () => {
      if (moderatorUserId !== userId) {
        return;
      }

      const jiraResults = await postEstimatesToJira(schedule, roomStateManager);
      await sendSessionSummary(
        schedule,
        getDefaultScheduleCodes(),
        roomStateManager,
        scratchboard,
        roster,
        lockedRooms,
        lockedBy,
        jiraResults,
        sessionEmails,
      );

      sessionPin = undefined;
      clearPinTimer();
      moderatorUserId = undefined;
      sessionEmails.clear();
      lockedRooms = new Set<string>();
      lockedBy.clear();
      schedule = getDefaultSchedule();
      playSounds = true;
      drumrollType = "random";
      Array.from(roomStateManager.roomKeys()).forEach((key: string) => {
        roomStateManager.purgeSignal(key);
        roomStateManager.purgePoker(key);
      });
      roster.clear();
      scratchboard.clear();

      // Disconnect everyone (including moderator)
      for (const [, s] of apiNamespace.sockets) {
        s.disconnect(true);
      }
    });

    socket.on("leave_room", (roomName) => {
      socket.leave(roomName);

      handleBroadcastSchedule(roomName);
    });

    socket.on("user_action", (msg) => {
      const roomName = getUserRoom(socket);
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

      const roomName = getUserRoom(socket);
      if (roomName) {
        broadcastRoom(roomName);
      }

      if (moderatorUserId === userId) {
        clearModerator();
      }
    });

    socket.on("disconnect", () => {
      broadcastServerStatus();
      startPinClearTimerIfNeeded();
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

  function broadcastScratchboard() {
    const scratchboardSerialized = Array.from(scratchboard.entries()).map(([key, value]) => [
      key,
      {
        typingUserId: value.typingUserId,
        text: value.text,
      },
    ]);
    apiNamespace.emit("scratchboard_update", scratchboardSerialized);
  }

  function broadcastSchedule() {
    schedule.forEach((item) => {
      const room = io.sockets.adapter.rooms.get(item.code);
      const userCount = room ? room.size : 0;
      item.size = userCount;

      if (lockedRooms.has(item.code)) {
        item.locked = true;
        item.lockedBy = lockedBy.get(item.code);
      } else {
        item.locked = false;
        item.lockedBy = undefined;
      }
    });
    apiNamespace.emit("schedule_update", schedule);
  }

  function broadcastServerStatus() {
    apiNamespace.emit("server_status", getServerStatus());
  }

  function clearModerator(broadcast: boolean = true) {
    moderatorUserId = undefined;
    if (broadcast) {
      broadcastServerStatus();
    }
  }

  function getServerStatus() {
    const rosterSerialized = Object.fromEntries(roster);
    return {
      moderatorUserId: moderatorUserId,
      roster: rosterSerialized,
      numConnected: apiNamespace.sockets.size,
      playSounds: playSounds,
      hasPin: !!sessionPin,
    };
  }

  function broadcastRoom(roomName: string) {
    const roomState = roomStateManager.getRoomState(roomName);
    if (roomState) {
      apiNamespace.to(roomName).emit("room_state", roomState);
    }
  }
}
