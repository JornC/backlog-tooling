import express from "express";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupSocketEvents } from "./api/socketEvents";

const app: express.Application = express();
const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server);

setupSocketEvents(io);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listening on *:${port}`);

  app.get("/ping", (_req, res) => {
    res.send("pong");
  });
});
