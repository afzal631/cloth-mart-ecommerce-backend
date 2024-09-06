const dotenv = require("dotenv");
dotenv.config();
const Redis = require("ioredis");

function redisClient() {
  if (process.env.REDIS_CONNECT) {
    console.log(`Redis connected`);
    return process.env.REDIS_CONNECT;
  }
  throw new Error("Redis connection failed");
}
const redis = new Redis(redisClient());
module.exports = redis;
