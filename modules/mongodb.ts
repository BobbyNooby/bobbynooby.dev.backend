import { Db, MongoClient } from "mongodb";

export class MongoDBClient {
  client: MongoClient;
  db: Db;

  constructor() {
    try {
      this.consoleBob("Connecting to MongoDB...");
      this.client = new MongoClient(process.env.MONGO_ADMIN_URL!, {
        tls: true,
        ssl: true,
      });
      this.client.connect();
      this.db = this.client.db();
      this.consoleBob("Connected to MongoDB.");
    } catch (e) {
      this.consoleBob(`Error connecting to MongoDB : ${e}`);
      process.exit(1);
    }
  }

  consoleBob(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}] [MongoDB]`, ...args);
  }
}
