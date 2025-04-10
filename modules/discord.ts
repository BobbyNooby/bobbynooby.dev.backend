import { Client, IntentsBitField } from "discord.js";
import { DiscordStatuses } from "../types";
import WebSocket from "ws";

export class DiscordBot {
  websockets: Set<WebSocket>;
  client: Client;
  status: DiscordStatuses;

  constructor() {
    // Changed from DiscordBot() to constructor()
    this.websockets = new Set<WebSocket>();
    this.client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildPresences,
      ],
    });
    this.status = "unknown";
  }

  async initialize() {
    try {
      this.consoleBob("Connecting to Discord Bot...");
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      this.consoleBob("Connected to Discord Bot.");

      this.consoleBob("Setting up event listeners...");
      this.setupEventListeners();
      this.consoleBob("Event listeners set up.");
    } catch (e) {
      this.consoleBob(`Error connecting to Discord Bot : ${e}`);
      process.exit(1);
    }
  }

  private setupEventListeners() {
    this.client.on("presenceUpdate", async (oldPresence, newPresence) => {
      if (newPresence.user) {
        if (newPresence.user.id === process.env.DISCORD_USER_ID) {
          this.status = newPresence.status as DiscordStatuses;
          this.consoleBob(`Status changed to ${this.status}`);
          this.broadcast({ status: this.status });
        }
      }
    });
  }

  addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);
  }

  removeWebSocket(ws: WebSocket) {
    this.websockets.delete(ws);
  }

  broadcast(message: any) {
    const jsonMessage = JSON.stringify(message);
    for (const ws of this.websockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(jsonMessage);
      }
    }
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [Discord]`, ...args);
  }
}
