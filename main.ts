import dotenv from "dotenv";
import express from "express";
import { consoleBob } from "./utils";
import { WebSocketServer } from "ws";
import { DiscordBot } from "./modules/discord";
import { UserCount } from "./modules/userCount";
import { SpotifyClient } from "./modules/spotify";
import { MongoDBClient } from "./modules/mongodb";
import { SimpleChat } from "./modules/chat";

dotenv.config();

const app = express();
const port = 3000;

const server = app.listen(port, () => {
  consoleBob("Server started");
  consoleBob("Listening on port 3000");
});

const wss = new WebSocketServer({ server });
const mongoDbClient = new MongoDBClient();
await mongoDbClient.initialize();

const discordBot = new DiscordBot();
await discordBot.initialize();

const userCount = new UserCount();

const spotifyClient = new SpotifyClient(mongoDbClient);
await spotifyClient.initialize();

const chat = new SimpleChat(mongoDbClient);

wss.on("connection", (ws, req) => {
  const subroute = req.url;
  consoleBob(`WebSocket connection connected to ${subroute}`);

  if (subroute === "/discord") {
    discordBot.addWebSocket(ws);

    ws.on("close", () => {
      discordBot.removeWebSocket(ws);
      consoleBob("WebSocket connection to /discord closed");
    });
  }

  if (subroute === "/userCount") {
    userCount.addWebSocket(ws);

    ws.on("close", () => {
      userCount.removeWebSocket(ws);
      consoleBob("WebSocket connection to /userCount closed");
    });
  }

  if (subroute === "/spotify") {
    spotifyClient.addWebSocket(ws);

    ws.on("close", () => {
      spotifyClient.removeWebSocket(ws);
      consoleBob("WebSocket connection to /spotify closed");
    });
  }

  if (subroute === "/chat") {
    chat.addWebSocket(ws);

    ws.on("message", (message) => {
      chat.onRecieve(String(message));
    });

    ws.on("close", () => {
      chat.removeWebSocket(ws);
      consoleBob("WebSocket connection to /chat closed");
    });
  }
});

wss.on("close", () => {
  consoleBob("WebSocket server closed");
});
