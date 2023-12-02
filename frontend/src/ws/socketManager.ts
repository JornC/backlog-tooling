import type { ButtonPressEvent } from "@/domain/types";
import { Socket, io } from "socket.io-client";

class SocketManager {
  private socket: Socket;
  private currentRoom: string | null = null;

  private connected: boolean = false;

  constructor() {
    console.log("Connecting..");
    this.socket = io("http://localhost:8080/api", { path: "/api/socket.io" });
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on("connect", () => {
      this.connected = true;
      console.log("Connected to WebSocket server");
    });
  }

  isConnected() {
    return this.connected;
  }

  joinRoom(roomName: string) {
    if (this.currentRoom) {
      this.socket.emit("leaveRoom", this.currentRoom);
    }
    this.currentRoom = roomName;
    this.socket.emit("joinRoom", roomName);
  }

  leaveRoom() {
    if (this.currentRoom) {
      this.socket.emit("leaveRoom", this.currentRoom);
      this.currentRoom = null;
    }
  }

  emitEvent(event: ButtonPressEvent): void {
    this.socket.emit("buttonPressEvent", event);
  }

  onEvent(callback: (event: ButtonPressEvent) => void): void {
    console.log("Got event: ", event);
    this.socket.on("buttonPressEvent", callback);
  }
}

export const socketManager = new SocketManager();
