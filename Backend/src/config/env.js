import dotenv from "dotenv";

dotenv.config();

const clean = (value) => (typeof value === "string" ? value.trim() : value);

const env = {
  // server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // redis
  REDIS_URL: clean(process.env.REDIS_URL),

  // mongo
  MONGO_URI: clean(process.env.MONGO_URI),

  // mqtt
  MQTT_BROKER_URL: clean(process.env.MQTT_BROKER_URL),
  MQTT_TOPIC_SENSOR: clean(process.env.MQTT_TOPIC_SENSOR),
  MQTT_TOPIC_TRIGGER: clean(process.env.MQTT_TOPIC_TRIGGER) || "grain/camera/trigger",
  MQTT_TOPIC_STATUS: clean(process.env.MQTT_TOPIC_STATUS) || "grain/camera/status",
  MQTT_TOPIC_IMAGE: clean(process.env.MQTT_TOPIC_IMAGE) || "grain/camera/image",
  MQTT_CAMERA_CAPTURE_INTERVAL_MS: Number(process.env.MQTT_CAMERA_CAPTURE_INTERVAL_MS) || 5000,

  // ai
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS) || 8000,

  // frontend
  FRONTEND_URL: clean(process.env.FRONTEND_URL),
};

export default env;
