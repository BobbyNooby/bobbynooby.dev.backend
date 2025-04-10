import { consoleBob } from "../utils";
import WebSocket from "ws";

export class UserCount {
  websockets: Set<WebSocket>;
  userCount: number;
  constructor() {
    this.websockets = new Set<WebSocket>();
    this.userCount = this.websockets.size;
  }

  addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);
    this.updateUserCount();
  }

  removeWebSocket(ws: WebSocket) {
    this.websockets.delete(ws);
    this.updateUserCount();
  }

  updateUserCount() {
    this.userCount = this.websockets.size;
    consoleBob(`[UserCount] User count updated to ${this.userCount}`);
    this.broadcast({ userCount: this.userCount });
  }

  broadcast(message: any) {
    const jsonMessage = JSON.stringify(message);
    for (const ws of this.websockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(jsonMessage);
      }
    }
  }
}
