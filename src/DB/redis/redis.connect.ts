import { createClient } from "redis";
import { REDIS_URL } from "../../config/config.service";

export const redisClient = createClient({
    url: REDIS_URL
})

export const redisConnection = async () => {
    await redisClient.connect()
    .then(() => {
        console.log(`Redis connected successfully ✅`);
    })
    .catch((err) => {
        console.log(`Fail to connect redis ❌`, err);
    })
}