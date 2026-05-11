import { MongoClient } from "mongodb";
import config from "./config";

export const mongoClient = new MongoClient(
  process.env.MONGODB_CONN_URL as string,
);
export const appdb = mongoClient.db(config.appdb);
