import { getIO } from "../config/socket.js";

/**
 * Emit realtime environmental sensor data
 * Used by: MQTT service
 */
export const createSensorRealtimeEmitter = ({ ioGetter = getIO } = {}) => {
  return (sensorData) => {
    try {
      const io = ioGetter();

      io.emit("sensor:update", {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        moisture: sensorData.moisture,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("❌ Socket emit error:", err.message);
    }
  };
};

/**
 * Emit full AI report (saved MongoDB document) to frontend
 * Called after inferAI saves to MongoDB — MongoDB is source of truth
 */
export const createAIReportEmitter = ({ ioGetter = getIO } = {}) => {
  return (report) => {
    try {
      const io = ioGetter();
      io.emit("report:new", report);
      console.log("📡 Emitted report:new to frontend");
    } catch (err) {
      console.error("❌ Socket report emit error:", err.message);
    }
  };
};

export const createCameraStatusEmitter = ({ ioGetter = getIO } = {}) => {
  return (status) => {
    try {
      const io = ioGetter();
      io.emit("camera:status", status);
    } catch (err) {
      console.error("❌ Camera status emit error:", err.message);
    }
  };
};

export const createCameraImageEmitter = ({ ioGetter = getIO } = {}) => {
  return (base64Image) => {
    try {
      const io = ioGetter();
      io.emit("camera:image", base64Image);
    } catch (err) {
      console.error("❌ Camera image emit error:", err.message);
    }
  };
};

export const emitSensorRealtime = createSensorRealtimeEmitter();
export const emitAIReport = createAIReportEmitter();
export const emitCameraStatus = createCameraStatusEmitter();
export const emitCameraImage = createCameraImageEmitter();
