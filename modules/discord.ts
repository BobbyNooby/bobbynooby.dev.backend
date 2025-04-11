import {
  Client,
  Guild,
  GuildMember,
  IntentsBitField,
  TextChannel,
} from "discord.js";
import { DiscordStatuses } from "../types";
import { consoleBob } from "../utils";
import WebSocket from "ws";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!DISCORD_BOT_TOKEN) {
  consoleBob("DISCORD_BOT_TOKEN is not set");
}

const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
if (!DISCORD_GUILD_ID) {
  consoleBob("DISCORD_GUILD_ID is not set");
}

const DISCORD_CHATLOG_CHANNEL = process.env.DISCORD_CHATLOG_CHANNEL;
if (!DISCORD_CHATLOG_CHANNEL) {
  consoleBob("DISCORD_CHATLOG_CHANNEL is not set");
}

const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
if (!DISCORD_USER_ID) {
  consoleBob("DISCORD_USER_ID is not set");
}

export class DiscordBot {
  websockets: Set<WebSocket>;
  client: Client;
  status: DiscordStatuses;
  server: Guild;
  user: GuildMember;
  chatChannel: TextChannel;

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
      await this.client.login(DISCORD_BOT_TOKEN!);
      this.consoleBob("Connected to Discord Bot.");

      this.consoleBob("Setting up event listeners...");
      this.setupEventListeners();
      this.consoleBob("Event listeners set up.");

      this.consoleBob("Fetching Server...");
      this.server = await this.client.guilds.fetch(DISCORD_GUILD_ID!);
      this.consoleBob("Server fetched.");

      this.consoleBob("Fetching User...");
      this.user = await this.server.members.fetch(DISCORD_USER_ID!);
      this.consoleBob(
        `User fetched. Username of user to check status for : ${this.user.user.username}`
      );

      this.consoleBob("Setting up Chat Channel...");
      const chatChannel = await this.client.channels.fetch(
        DISCORD_CHATLOG_CHANNEL!
      );
      if (chatChannel === null) {
        this.consoleBob("Chat Channel not found.");
        process.exit(1);
      }
      if (!(chatChannel instanceof TextChannel)) {
        this.consoleBob("Chat Channel is not a TextChannel.");
        process.exit(1);
      }
      this.chatChannel = chatChannel as TextChannel;
      this.consoleBob("Chat Channel set up.");
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
    const presenceStatus = this.user.presence?.status || "offline";

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

  async sendDiscordMessage(name: string, message: string, rank: string) {
    const parsedName = rank == "owner" ? `👑**${name}**` : name;
    const parsedMessage = message;
    const sentMessage = `${parsedName} : ${parsedMessage}`;
    await this.chatChannel.send(sentMessage);
  }
}
