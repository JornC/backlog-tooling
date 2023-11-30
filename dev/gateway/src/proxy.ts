import { IncomingMessage } from "http";

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const apiProxy = createProxyMiddleware("/api", {
  target: "http://localhost:3000",
  changeOrigin: true,
  pathRewrite: {
    "^/api": "",
  },
});

const frontendProxy = createProxyMiddleware({
  target: "http://localhost:5173",
  changeOrigin: true,
  ws: true,
});

// Apply middleware
app.use("/api", apiProxy);
app.use("/", frontendProxy);

const server = app.listen(8080, () => {
  console.log(`Proxy server listening on port 8080`);
});

// WebSocket Proxy
server.on("upgrade", (req: IncomingMessage, socket: any, head: any) => {
  frontendProxy.upgrade(req, socket, head);
});
