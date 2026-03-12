import redisClient from "../config/redis.js";

/**
 * Store raw MQTT payload temporarily (simple key for frontend)
 */
export const storeRawSensorData = async (data) => {
  try {
    await redisClient.set("latest:sensor", JSON.stringify(data));
  } catch (err) {
    console.error("Redis storeRawSensorData error:", err);
  }
};

/**
 * Push MQTT data into Redis Stream "grain_stream"
 * Maps nested MQTT fields → flat fields expected by Python advisory agent
 */
export const pushToGrainStream = async (data) => {
  try {
    const imp = data.impurities || {};
    const streamFields = {
      temperature: String(data.temperature ?? 0),
      humidity: String(data.humidity ?? 0),
      moisture: String(data.moisture ?? 0),
      purity: String(data.purity ?? 0),
      grade: data.grade || "C",
      husk: String(imp.husk ?? 0),
      stone: String(imp.stones ?? 0),
      broken: String(imp.brokenPieces ?? 0),
      insect_damage: String(imp.insectDamage ?? 0),
      black_seed: String(imp.blackSpots ?? 0),
      discoloration: String(imp.discolored ?? 0),
    };
    await redisClient.xAdd("grain_stream", "*", streamFields);
    console.log("📥 Pushed to grain_stream");
  } catch (err) {
    console.error("Redis pushToGrainStream error:", err);
  }
};

export const getLatestSensorData = async () => {
  try {
    const data = await redisClient.get("latest:sensor");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis getLatestSensorData error:", err);
    return null;
  }
};

export const pushToAIQueue = async (payload) => {
  try {
    await redisClient.rPush("queue:ai", JSON.stringify(payload));
  } catch (err) {
    console.error("Redis pushToAIQueue error:", err);
  }
};

export const popFromAIQueue = async () => {
  try {
    const job = await redisClient.lPop("queue:ai");
    return job ? JSON.parse(job) : null;
  } catch (err) {
    console.error("Redis popFromAIQueue error:", err);
    return null;
  }
};
