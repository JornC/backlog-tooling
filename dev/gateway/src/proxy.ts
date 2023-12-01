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
  ws: true,
});

const frontendProxy = createProxyMiddleware({
  target: "http://localhost:5173",
  changeOrigin: true,
  ws: true,
});

app.use("/api", apiProxy);
app.use("/", frontendProxy);

const server = app.listen(8080, () => {
  console.log(`Proxy server listening on port 8080`);
});

server.on("upgrade", (req: IncomingMessage, socket: any, head: any) => {
  if (req.url!.startsWith("/api")) {
    apiProxy.upgrade(req, socket, head);
  } else {
    frontendProxy.upgrade(req, socket, head);
  }
});
