import { createClient } from "redis";
import { config } from "./config/app.config";

const redisClient = createClient({
    username: config.REDIS.USERNAME,
    password: config.REDIS.PASSWORD,
    socket: {
        host: config.REDIS.HOST,
        port: Number(config.REDIS.PORT),
    },
});

redisClient.on("connect", () => console.log("✅ Connected to Redis Cloud"));
redisClient.on("error", (err) => console.error("❌ Redis Client Error:", err));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
};

export default redisClient;
