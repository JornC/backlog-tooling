import express from "express";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupRoutes } from "./api/httpRoutes";
import { setupSocketEvents } from "./api/socketEvents";

const app: express.Application = express();
const server: HTTPServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(server);

// Setup Socket.IO events
setupSocketEvents(io);

// Setup HTTP routes
setupRoutes(app);
