import { Db } from "mongodb";
import WebSocket from "ws";
import { MongoDBClient } from "./mongodb";
import { ChatMessage, RecievedChatMessage } from "../types";

const starterMessages: ChatMessage[] = [
  {
    message: "Welcome to the chat! Use /username to change your username.",
    rank: "owner",
    created_at: new Date().toISOString(),
    name: "bobbynooby.dev",
  },
  {
    message: "If the name is green, its me! If not, its someone else.",
    rank: "owner",
    created_at: new Date().toISOString(),
    name: "bobbynooby.dev",
  },
];

export class SimpleChat {
  users: Set<WebSocket>;
  mongoClient: MongoDBClient;
  db: Db;

  constructor(mongoDbClient: MongoDBClient) {
    {
      this.users = new Set<WebSocket>();
      this.db = mongoDbClient.dbVPS;
      this.mongoClient = mongoDbClient;
    }
  }

  async onRecieve(message: string) {
    const parsedMessage = JSON.parse(message) as RecievedChatMessage;

    const requiredKeys = ["name", "message"];

    for (const key of requiredKeys) {
      if (Object.hasOwn(parsedMessage, key) === false) {
        this.consoleBob(`Invalid Message : ${message}`);
        return;
      }
    }

    const messageObject: ChatMessage = {
      name: parsedMessage.name,
      created_at: new Date().toISOString(),
      message: parsedMessage.message,
      rank:
        (await this.mongoClient.isAdmin(parsedMessage.sessionId)) == true
          ? "owner"
          : "guest",
    };

    this.db.collection("chat-dev").insertOne(messageObject);
    this.broadcast({ message: messageObject });
  }

  async addWebSocket(ws: WebSocket) {
    this.users.add(ws);

    const pastMessages: ChatMessage[] = [
      ...(await this.getLastMessages()),
      ...starterMessages,
    ];

    ws.send(JSON.stringify({ initialMessages: pastMessages }));
  }

  removeWebSocket(ws: WebSocket) {
    this.users.delete(ws);
  }

  broadcast(message: any) {
    for (const ws of this.users) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  async getLastMessages(count: number = 100): Promise<ChatMessage[]> {
    return await this.db
      .collection<ChatMessage>("chat-dev")
      .find()
      .sort({ created_at: 1 })
      .limit(count)
      .toArray();
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [Chat]`, ...args);
  }
}
