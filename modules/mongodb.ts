import { Db, MongoClient } from "mongodb";

export class MongoDBClient {
  atlasClient: MongoClient;
  vpsClient: MongoClient;
  dbAtlas: Db;
  dbVPS: Db;

  constructor() {}

  async initialize() {
    try {
      this.consoleBob("Connecting to MongoDB...");
      this.atlasClient = new MongoClient(process.env.MONGO_ATLAS_URL!, {
        tls: true,
        ssl: true,
      });
      this.vpsClient = new MongoClient(process.env.MONGO_VPS_URL!);

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
