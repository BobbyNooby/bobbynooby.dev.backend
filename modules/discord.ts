import { Client, GuildMember, IntentsBitField } from "discord.js";
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
          this.consoleBob(`Status changed to ${newPresence.status}`);
          this.broadcast({ status: newPresence.status });
        }
      }
    });
  }

  async getDiscordStatus() {
    const server = await this.client.guilds.fetch(
      process.env.DISCORD_GUILD_ID!
    );
    const user: GuildMember = await server.members.fetch(
      process.env.DISCORD_USER_ID!
    );
    const presenceStatus = user.presence?.status || "offline";

    return presenceStatus;
  }

  async addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);

    ws.send(JSON.stringify({ status: await this.getDiscordStatus() }));
  }

  removeWebSocket(ws: WebSocket) {
    this.websockets.delete(ws);
  }

  broadcast(message: any) {
    for (const ws of this.websockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [Discord]`, ...args);
  }
}
