import express from "express";
import { createServer, Server as HTTPServer } from "http";
import { existsSync } from "fs";
import { join } from "path";
import { Server as SocketIOServer } from "socket.io";
import { setupSocketEvents } from "./api/socketEvents";

const app = express();

app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  next();
});

app.get("/api/ping", (_req, res) => {
  res.send("pong");
});

const frontendDist = join(__dirname, "../../frontend/dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(join(frontendDist, "index.html"));
  });
}

const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server, {
  path: "/api/socket.io",
  cors: {
    origin: process.env.CORS_ORIGIN || "https://aeriusbacklog.nl",
  },
});

setupSocketEvents(io, app);

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
