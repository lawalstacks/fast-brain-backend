import { createClient } from "redis";
import { config } from "./config/app.config";

const redisClient = createClient({
    username: config.REDIS_USERNAME,
    password: config.REDIS_PASSWORD,
    socket: {
        host: config.REDIS_HOST,
        port: Number(config.REDIS_PORT),
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
