import config from "../../config/app.js";
import { createClient } from "redis";
import ErrorReporting from "./ErrorReporting.js";
import Logger from "./Logger.js";

let errorsBeforeConnect = 0;

const client = createClient({
	url: config.redis.url,
	database: config.redis.db,
});
client.on("error", (e: Error) => {
	errorsBeforeConnect++;
	if (errorsBeforeConnect >= 5) throw e;
	else ErrorReporting.reportAny(e);
});

client.on("connect", () => {
	Logger.info("Connected to Redis");
	errorsBeforeConnect = 0;
});
client.on("reconnecting", (o: any) => {
	Logger.warning(`Redis client reconnecting, attempt ${o?.attempt}, delay ${o?.delay}`);
});
client.on("end", () => {
	Logger.warning("Disconnected from Redis");
});
// client.on('monitor', (time: any, args: any) => { Logger.info("Redis monitor '${JSON.stringify({ time, args })}'") });

// disable automatic export
export {};

export const redisConnect = async () => {
	await client.connect();
};
export const redisClient = client;
