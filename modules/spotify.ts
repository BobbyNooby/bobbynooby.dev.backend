import WebSocket from "ws";
import { Db } from "mongodb";
import { MongoDBClient } from "./mongodb";
import { consoleBob } from "../utils";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
if (!SPOTIFY_CLIENT_ID) {
  consoleBob("SPOTIFY_CLIENT_ID is not set");
  process.exit(1);
}
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
if (!SPOTIFY_CLIENT_SECRET) {
  consoleBob("SPOTIFY_CLIENT_SECRET is not set");
  process.exit(1);
}

const SPOTIFY_CLIENT_REFRESH_TOKEN = process.env.SPOTIFY_CLIENT_REFRESH_TOKEN;
if (!SPOTIFY_CLIENT_REFRESH_TOKEN) {
  consoleBob("SPOTIFY_CLIENT_REFRESH_TOKEN is not set");
  process.exit(1);
}

export type SpotifySongData = {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
};

export type SpotifyLastPlayedData = SpotifySongData & { playedAt: string };

export const errorSong: SpotifySongData = {
  isPlaying: false,
  title: "Error, song not found. Data shown below is a plug for my song!",
  artist: "BobbyNooby",
  album: "Credits Song For My Breakdown",
  albumImageUrl:
    "https://via.placeholder.com/150https://i.scdn.co/image/ab67616d0000b2730e4888261e7b8c069eff0eb7",
  songUrl: "https://open.spotify.com/album/1Wd1mI2VMP9YHf3Zcp1qhG",
};

export class SpotifyClient {
  websockets: Set<WebSocket>;
  access_token: string;
  db: Db;
  private interval: NodeJS.Timeout | null;

  constructor(mongoDbClient: MongoDBClient) {
    this.websockets = new Set<WebSocket>();
    this.access_token = "";
    this.interval = null;
    this.db = mongoDbClient.dbAtlas;
  }

  async initialize() {
    try {
      await this.refreshToken();
      this.startPolling();
    } catch (e) {
      this.consoleBob(`Error connecting to Spotify : ${e}`);
      process.exit(1);
    }
  }

  async refreshToken() {
    const access_token_response = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: SPOTIFY_CLIENT_REFRESH_TOKEN!,
          client_id: SPOTIFY_CLIENT_ID!,
          client_secret: SPOTIFY_CLIENT_SECRET!,
          redirect_uri: "https://bobbynooby.dev/",
        }),
      }
    ).then((res) => res.json());

    this.access_token = access_token_response.access_token;
    if (!this.access_token || this.access_token === "") {
      throw new Error("No access token");
    }
  }

  startPolling() {
    // Clear existing interval if any
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Poll every 5 seconds
    this.interval = setInterval(async () => {
      try {
        await this.checkCurrentSong();
      } catch (error) {
        this.consoleBob(`Error polling Spotify: ${error}`);
        await this.refreshToken();
      }
    }, 5000);
  }

  async checkCurrentSong() {
    if (!this.access_token) {
      await this.refreshToken();
    }

    const res = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${this.access_token}`,
        },
      }
    );

    if (res.status === 204 || res.status > 400) {
      // If no content or error, get from MongoDB
      await this.refreshToken();
      await this.sendLastPlayedFromDB();
      return;
    }

    const song = await res.json();
    const isPlaying = song.is_playing;
    const title = song.item.name;
    const artist = song.item.artists
      .map((_artist: any) => _artist.name)
      .join(", ");
    const album = song.item.album.name;
    const albumImageUrl = song.item.album.images[0].url;
    const songUrl = song.item.external_urls.spotify;

    const currentSong: SpotifySongData = {
      isPlaying,
      title,
      artist,
      album,
      albumImageUrl,
      songUrl,
    };

    if (isPlaying) {
      this.broadcast({ song: currentSong });
      this.songLog(currentSong);
      await this.updateLastPlayed(currentSong);
    } else {
      await this.sendLastPlayedFromDB();
    }
  }

  async sendLastPlayedFromDB() {
    const lastPlayed = (await this.db
      .collection("recently_played")
      .findOne({})) as SpotifyLastPlayedData | null;

    if (lastPlayed) {
      const lastPlayedSong: SpotifyLastPlayedData = {
        isPlaying: false,
        title: lastPlayed.title,
        artist: lastPlayed.artist,
        album: lastPlayed.album,
        albumImageUrl: lastPlayed.albumImageUrl,
        songUrl: lastPlayed.songUrl,
        playedAt: lastPlayed.playedAt,
      };
      this.broadcast({ song: lastPlayedSong });
      this.songLog(lastPlayedSong);
    } else {
      // Fallback to error song if nothing in DB
      this.broadcast({ song: errorSong });
      this.songLog(errorSong);
    }
  }

  async updateLastPlayed(currentSong: SpotifySongData) {
    const recentlyPlayed = (await this.db
      .collection("recently_played")
      .findOne({})) as SpotifyLastPlayedData | null;

    const currentDateTime = new Date().toISOString();
    const lastPlayedSong: SpotifyLastPlayedData = {
      ...currentSong,
      playedAt: currentDateTime,
    };
    lastPlayedSong.isPlaying = false; // Store as not playing in DB

    if (!recentlyPlayed || recentlyPlayed.songUrl !== currentSong.songUrl) {
      await this.db.collection("recently_played").deleteMany({});
      await this.db.collection("recently_played").insertOne(lastPlayedSong);
    }
  }

  async addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);
    this.checkCurrentSong();
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

  songLog(song: SpotifySongData | SpotifyLastPlayedData) {
    // this.consoleBob(
    //   `[Spotify] Song Status : ${song.isPlaying ? "Playing" : "Not playing"}`
    // );
    this.consoleBob(`Song Title : ${song.title}`);
    // this.consoleBob(`[Spotify] Song Artist : ${song.artist}`);
    // this.consoleBob(`[Spotify] Song Album : ${song.album}`);
    // this.consoleBob(`[Spotify] Song Album Image URL : ${song.albumImageUrl}`);
    // this.consoleBob(`[Spotify] Song URL : ${song.songUrl}`);

    // if (Object.hasOwn(song, "playedAt")) {
    //   const songAs = song as SpotifyLastPlayedData;
    //   const currentTime = new Date().getTime();
    //   const playedAt = new Date(songAs.playedAt).getTime();
    //   const timeDifference = Math.abs(currentTime - playedAt) / 1000;

    //   this.consoleBob(timeDifference);
    //   this.consoleBob(
    //     `Song played at : ${secondsToTimeString(timeDifference)}`
    //   );
    // }
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [Spotify]`, ...args);
  }
}
