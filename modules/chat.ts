import { Db } from "mongodb";
import WebSocket from "ws";
import { MongoDBClient } from "./mongodb";
import { ChatMessage, RecievedChatMessage } from "../types";
import { DiscordBot } from "./discord";

const CHAT_COLLECTION = process.env.CHAT_COLLECTION;

if (!CHAT_COLLECTION) {
  console.log("CHAT_COLLECTION is not set");
  process.exit(1);
}

export class SimpleChat {
  users: Set<WebSocket>;
  mongoClient: MongoDBClient;
  discordBot: DiscordBot;
  db: Db;

  constructor(mongoDbClient: MongoDBClient, discordBot: DiscordBot) {
    {
      this.users = new Set<WebSocket>();
      this.db = mongoDbClient.dbVPS;
      this.mongoClient = mongoDbClient;
      this.discordBot = discordBot;
    }
  }

  async onRecieve(message: string, sessionId: string) {
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
        (await this.mongoClient.isAdmin(sessionId)) == true ? "owner" : "guest",
    };

    await this.db
      .collection(CHAT_COLLECTION || "chat-prod")
      .insertOne(messageObject);
    await this.discordBot.sendDiscordMessage(
      parsedMessage.name,
      parsedMessage.message,
      messageObject.rank
    );
    this.broadcast({ message: messageObject });
  }

  async addWebSocket(ws: WebSocket) {
    this.users.add(ws);

    const pastMessages: ChatMessage[] = [...(await this.getLastMessages())];

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

  async getLastMessages(count: number = 500): Promise<ChatMessage[]> {
    return await this.db
      .collection<ChatMessage>(CHAT_COLLECTION || "chat-prod")
      .find()
      .sort({ created_at: -1 })
      .limit(count)
      .toArray().then((messages) => messages.reverse());
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [Chat]`, ...args);
  }
}
