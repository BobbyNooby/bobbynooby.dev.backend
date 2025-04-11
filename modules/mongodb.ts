import { Db, MongoClient } from "mongodb";
import { consoleBob } from "../utils";

const MONGO_ATLAS_URL = process.env.MONGO_ATLAS_URL;
if (!MONGO_ATLAS_URL) {
  consoleBob("MONGO_ATLAS_URL is not set");
  process.exit(1);
}

const MONGO_VPS_URL = process.env.MONGO_VPS_URL;
if (!MONGO_VPS_URL) {
  consoleBob("MONGO_VPS_URL is not set");
  process.exit(1);
}

export class MongoDBClient {
  atlasClient: MongoClient;
  vpsClient: MongoClient;
  dbAtlas: Db;
  dbVPS: Db;

  constructor() {}

  async initialize() {
    try {
      this.consoleBob("Connecting to MongoDB...");
      this.atlasClient = new MongoClient(MONGO_ATLAS_URL!, {
        tls: true,
        ssl: true,
      });

      if (!process.env.MONGO_VPS_URL) {
        this.consoleBob("MONGO_VPS_URL is not set");
        process.exit(1);
      }
      this.vpsClient = new MongoClient(MONGO_VPS_URL!);

      this.consoleBob("Connecting to Atlas...");
      await this.atlasClient.connect();
      this.dbAtlas = this.atlasClient.db();
      this.consoleBob("Connected to Atlas.");

      this.consoleBob("Connecting to VPS...");
      await this.vpsClient.connect();
      this.dbVPS = this.vpsClient.db();
      this.consoleBob("Connected to VPS.");

      this.consoleBob("Connected to MongoDB.");
    } catch (e) {
      this.consoleBob(`Error connecting to MongoDB : ${e}`);
      process.exit(1);
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    if (
      await this.dbAtlas
        .collection("admin_ids")
        .findOne({ id: userId, admin: true })
    ) {
      return true;
    }

    return false;
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [MongoDB]`, ...args);
  }
}
