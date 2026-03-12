import mqtt from "mqtt";
import env from "../config/env.js";

import { emitSensorRealtime, emitAIReport, emitCameraStatus, emitCameraImage } from "./socketService.js";
import { storeRawSensorData, pushToGrainStream } from "./redisService.js";
import { validateRawPayload } from "./validationService.js";
import { runAIInference } from "./aiService.js";

/* 
   CONNECT TO MQTT BROKER
   */

export let client = null;

export const createMQTTInitializer = ({
  mqttLib = mqtt,
  mqttEnv = env,
  emitRealtime = emitSensorRealtime,
  emitReport = emitAIReport,
  storeRaw = storeRawSensorData,
  storeStream = pushToGrainStream,
  validatePayload = validateRawPayload,
  inferAI = runAIInference,
  emitCamStatus = emitCameraStatus,
  emitCamImage = emitCameraImage,
} = {}) => {
  return () => {
    let captureInterval = null;

    client = mqttLib.connect(mqttEnv.MQTT_BROKER_URL);

    client.on("connect", () => {
      console.log("MQTT connected");

      /* subscribe to sensor topic */
      client.subscribe(mqttEnv.MQTT_TOPIC_SENSOR, (err) => {
        if (err) console.error("MQTT subscribe error:", err);
        else console.log("MQTT topic subscribed:", mqttEnv.MQTT_TOPIC_SENSOR);
      });

      /* subscribe to trigger topic for logging/readiness */
      client.subscribe(mqttEnv.MQTT_TOPIC_TRIGGER || "grain/camera/trigger", (err) => {
        if (err) console.error("MQTT trigger subscribe error:", err);
        else console.log("MQTT trigger topic subscribed:", mqttEnv.MQTT_TOPIC_TRIGGER || "grain/camera/trigger");
      });

      /* subscribe to camera status/image topics for relaying */
      client.subscribe([mqttEnv.MQTT_TOPIC_STATUS, mqttEnv.MQTT_TOPIC_IMAGE], (err) => {
        if (err) console.error("MQTT camera sub error:", err);
        else console.log("MQTT camera topics subscribed");
      });

      const intervalMs = Number(mqttEnv.MQTT_CAMERA_CAPTURE_INTERVAL_MS) || 0;
      if (intervalMs > 0 && !captureInterval) {
        publishCaptureTrigger();
        captureInterval = setInterval(() => {
          publishCaptureTrigger();
        }, intervalMs);
        console.log(`[MQTT] Auto capture enabled every ${intervalMs}ms`);
      }
    });

    /* 
  
       HANDLE INCOMING MQTT MESSAGES
    
     */

    client.on("message", async (topic, messageBuffer) => {
      try {
        /* CAMERA STATUS/IMAGE PATH (Relay to Sockets) */
        if (topic === mqttEnv.MQTT_TOPIC_STATUS) {
          const status = messageBuffer.toString();
          console.log(`[CAMERA RELAY] Status: ${status}`);
          emitCamStatus(status); // Relay raw status string
          return;
        }

        if (topic === mqttEnv.MQTT_TOPIC_IMAGE) {
          console.log(`[CAMERA RELAY] Image received (Base64 length: ${messageBuffer.length})`);
          emitCamImage(messageBuffer.toString()); // Relay base64 image string
          return;
        }

        const message = JSON.parse(messageBuffer.toString());
        console.log("[MQTT IN]", topic, message);

        /* REALTIME SENSOR PATH */
        if (topic === mqttEnv.MQTT_TOPIC_SENSOR) {
          emitRealtime(message); // direct -> frontend
        }

        /* PROCESSING PATH */
        await storeRaw(message);       // SET latest:sensor (for frontend)
        await storeStream(message);    // XADD grain_stream (for AI agents)

        const result = validatePayload(message);
        if (!result.valid) {
          console.error("Validation failed:", result.errors);
          return;
        }

        const savedReport = await inferAI(result.data);
        emitReport(savedReport); // emit saved MongoDB doc to frontend
      } catch (err) {
        console.error("MQTT message handling error:", err.message);
      }
    });

    client.on("error", (err) => {
      console.error("MQTT error:", err.message);
    });

    client.on("close", () => {
      if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
      }
    });
  };
};

export const publishCaptureTrigger = () => {
  if (!client) {
    console.warn("MQTT client not connected, cannot publish trigger");
    return false;
  }
  client.publish(env.MQTT_TOPIC_TRIGGER || "grain/camera/trigger", "capture");
  console.log(`[MQTT OUT] Trigger published to ${env.MQTT_TOPIC_TRIGGER || "grain/camera/trigger"}`);
  return true;
};

export const initMQTT = createMQTTInitializer();
