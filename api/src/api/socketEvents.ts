import { Express } from "express";
import { Socket, Server as SocketIOServer } from "socket.io";
import { ActionType, RoomStateFragment, RoomStateManager } from "../data/roomStateManager";
import { ScratchboardState } from "../data/scratchboardmanager";
import { sendSessionSummary } from "../email/sessionSummary";
import { postEstimatesToJira } from "../jira/postEstimates";
import { postScratchboardComments } from "../jira/postComments";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function setupSocketEvents(io: SocketIOServer, app: Express) {
  let moderatorUserId: string | undefined = undefined;
  let moderatorGraceTimer: ReturnType<typeof setTimeout> | undefined;
  let moderatorGraceName: string | undefined;
  let moderatorReconnecting = false;
  const sessionEmails = new Set<string>();

  let lockedRooms = new Set<string>();
  const lockedBy = new Map<string, string>();

  let sessionPin: string | undefined = undefined;
  let pinClearTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  const pinAttempts = new Map<string, { count: number; blockedUntil: number }>();
  const PIN_MAX_ATTEMPTS = 5;
  const PIN_BLOCK_DURATION = 15 * 60 * 1000;

  function isPinBlocked(ip: string): boolean {
    const entry = pinAttempts.get(ip);
    if (!entry) return false;
    if (entry.blockedUntil > Date.now()) return true;
    pinAttempts.delete(ip);
    return false;
  }

  function recordPinFailure(ip: string) {
    const entry = pinAttempts.get(ip) || { count: 0, blockedUntil: 0 };
    entry.count++;
    if (entry.count >= PIN_MAX_ATTEMPTS) {
      entry.blockedUntil = Date.now() + PIN_BLOCK_DURATION;
    }
    pinAttempts.set(ip, entry);
  }

  function clearPinFailure(ip: string) {
    pinAttempts.delete(ip);
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function isValidEmail(v: unknown): v is string {
    return typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);
  }

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
    const ip = req.ip || "unknown";
    if (isPinBlocked(ip)) {
      res.status(429).json({ error: "Too many attempts, try again later" });
      return;
    }
    const pin = (req as any).body?.pin;
    if (!sessionPin || pin === sessionPin) {
      clearPinFailure(ip);
      res.status(200).json({ ok: true });
    } else {
      recordPinFailure(ip);
      res.status(401).json({ error: "Invalid PIN" });
    }
  });

  // PIN middleware - reject connections with wrong/missing PIN
  apiNamespace.use((socket, next) => {
    if (!sessionPin) {
      return next();
    }
    const ip = socket.handshake.address || "unknown";
    if (isPinBlocked(ip)) {
      return next(new Error("PIN_BLOCKED"));
    }
    const pin = socket.handshake.auth?.pin;
    if (pin === sessionPin) {
      clearPinFailure(ip);
      return next();
    }
    recordPinFailure(ip);
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
        await finishSession(true);
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

  async function finishSession(postToJira: boolean) {
    let jiraResults;
    let commentResults;
    if (postToJira) {
      jiraResults = await postEstimatesToJira(schedule, roomStateManager);
      commentResults = await postScratchboardComments(schedule, scratchboard);
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
        commentResults,
      );
    }

    sessionPin = undefined;
    clearPinTimer();
    cancelModeratorGrace();
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

    for (const [, s] of apiNamespace.sockets) {
      s.emit("session_ended");
      s.disconnect(true);
    }
  }

  // Admin endpoints - not guarded by the WebSocket PIN middleware
  const adminLogins: { ip: string; time: string }[] = [];

  app.use("/api/admin", (req, res, next) => {
    if (!ADMIN_SECRET) {
      res.status(404).json({ error: "Admin endpoints are disabled" });
      return;
    }
    const secret = req.headers["x-admin-secret"];
    if (secret !== ADMIN_SECRET) {
      res.status(401).json({ error: "Invalid admin secret" });
      return;
    }
    next();
  });

  app.post("/api/admin/login", (req, res) => {
    const ip = req.ip || "unknown";
    const time = new Date().toISOString();
    adminLogins.push({ ip, time });
    const cutoff = Date.now() - 24 * 60 * 60_000;
    while (adminLogins.length > 0 && new Date(adminLogins[0].time).getTime() < cutoff) {
      adminLogins.shift();
    }
    res.json({ ok: true });
  });

  app.get("/api/admin/status", (_req, res) => {
    const cutoff = Date.now() - 24 * 60 * 60_000;
    const recentLogins = adminLogins.filter((l) => new Date(l.time).getTime() >= cutoff);
    const moderatorName = moderatorUserId ? roster.get(moderatorUserId) : undefined;
    res.json({
      numConnected: apiNamespace.sockets.size,
      hasPin: !!sessionPin,
      pin: sessionPin || null,
      hasModerator: !!moderatorUserId,
      moderatorName: moderatorName || null,
      moderatorReconnecting,
      schedule,
      adminLogins: recentLogins,
    });
  });

  app.post("/api/admin/reset", async (_req, res) => {
    await finishSession(false);
    res.json({ ok: true });
  });

  apiNamespace.on("connection", (socket: Socket) => {
    clearPinTimer();
    console.log("Connection.");
    const userId = socket.id;

    socket.emit("user_socket_id", socket.id);
    broadcastSchedule();
    broadcastServerStatus();
    broadcastScratchboard();

    socket.on("join_room", (roomName) => {
      if (!sessionPin) { return; }
      if (!schedule.some((item) => item.code === roomName)) { return; }
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
        if (typeof name !== "string" || name.length > 100) { return; }
        roster.set(userId, name);

        if (moderatorReconnecting && moderatorGraceName === name) {
          cancelModeratorGrace();
          moderatorUserId = userId;
          socket.emit("session_emails", Array.from(sessionEmails));
          socket.emit("session_pin", sessionPin);
        }
      } else {
        roster.delete(userId);
      }
      broadcastServerStatus();
    });

    socket.on("claim_moderation", (emails?: string[]) => {
      cancelModeratorGrace();
      moderatorUserId = userId;
      if (emails) {
        for (const email of emails) {
          if (isValidEmail(email)) {
            sessionEmails.add(email);
          }
        }
      }
      socket.emit("session_emails", Array.from(sessionEmails));
      broadcastServerStatus();
    });

    socket.on("update_session_emails", (emails: string[]) => {
      if (moderatorUserId !== userId) {
        return;
      }
      sessionEmails.clear();
      for (const email of emails) {
        if (isValidEmail(email)) {
          sessionEmails.add(email);
        }
      }
      socket.emit("session_emails", Array.from(sessionEmails));
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
      if (!sessionPin) { return; }
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
      if (!sessionPin) { return; }
      if (typeof text !== "string" || text.length > 10000) { return; }
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
      if (!Array.isArray(arr)) { return; }

      schedule = arr;
      broadcastSchedule();
    });

    socket.on("persist_drumroll", (type) => {
      if (moderatorUserId !== userId) {
        return;
      }
      if (typeof type !== "string" || (type !== "random" && !drumrolls.includes(type))) { return; }

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
      if (moderatorUserId !== userId) { return; }
      playSounds = !playSounds;
      broadcastServerStatus();
    });

    socket.on("set_pin", () => {
      if (moderatorUserId !== userId) {
        return;
      }
      sessionPin = String(Math.floor(1000 + Math.random() * 9000));
      pinAttempts.clear();

      // Reset roster to only the moderator, starting a fresh participant list
      const moderatorName = roster.get(userId);
      roster.clear();
      if (moderatorName) {
        roster.set(userId, moderatorName);
      }

      socket.emit("session_pin", sessionPin);
      broadcastServerStatus();
      disconnectNonModerator();
    });

    socket.on("clear_pin", () => {
      if (moderatorUserId !== userId) {
        return;
      }
      sessionPin = undefined;
      pinAttempts.clear();
      clearPinTimer();
      broadcastServerStatus();
    });

    socket.on("reset_session", async () => {
      if (moderatorUserId !== userId) {
        return;
      }
      await finishSession(true);
    });

    socket.on("purge_session", async () => {
      if (moderatorUserId !== userId) {
        return;
      }
      await finishSession(false);
    });

    socket.on("force_reset_session", async () => {
      if (!sessionPin || moderatorUserId || moderatorReconnecting) {
        return;
      }
      if (apiNamespace.sockets.size !== 1) {
        return;
      }
      await finishSession(true);
    });

    socket.on("leave_room", (roomName) => {
      socket.leave(roomName);

      handleBroadcastSchedule(roomName);
    });

    socket.on("user_action", (msg) => {
      if (!sessionPin) { return; }
      if (!msg || !Object.values(ActionType).includes(msg.type)) { return; }
      if (msg.value !== undefined && typeof msg.value !== "string" && typeof msg.value !== "number") { return; }
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
        startModeratorGrace(userId);
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
    if (!sessionPin) { return; }
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
    if (!sessionPin) { return; }
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

  function startModeratorGrace(disconnectingUserId: string) {
    moderatorGraceName = roster.get(disconnectingUserId);
    moderatorReconnecting = true;
    moderatorUserId = undefined;
    broadcastServerStatus();
    moderatorGraceTimer = setTimeout(() => {
      moderatorGraceName = undefined;
      moderatorReconnecting = false;
      moderatorGraceTimer = undefined;
      broadcastServerStatus();
      apiNamespace.emit("moderator_left");
    }, 60_000);
  }

  function cancelModeratorGrace() {
    if (moderatorGraceTimer) {
      clearTimeout(moderatorGraceTimer);
      moderatorGraceTimer = undefined;
    }
    moderatorGraceName = undefined;
    moderatorReconnecting = false;
  }

  function clearModerator(broadcast: boolean = true) {
    cancelModeratorGrace();
    moderatorUserId = undefined;
    if (broadcast) {
      broadcastServerStatus();
    }
  }

  function getServerStatus() {
    const rosterSerialized = Object.fromEntries(roster);
    return {
      moderatorUserId: moderatorUserId,
      moderatorReconnecting: moderatorReconnecting,
      moderatorGraceName: moderatorGraceName,
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
