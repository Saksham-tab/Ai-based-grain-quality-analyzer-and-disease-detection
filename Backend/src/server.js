import express from "express";
import http from "http";
import cors from "cors";
import reportRoutes from "./routes/reportRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";


import env from "./config/env.js";
import redisClient from "./config/redis.js";
import { connectMongo } from "./config/mongo.js";
import { initSocket } from "./config/socket.js";
import { initMQTT } from "./services/mqttService.js";

const app = express();
const server = http.createServer(app);

/* Middlewares */
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
/* Routes */
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);


console.log("🟡 Starting backend services...");

/* Init Socket */
initSocket(server);
console.log("🟢 Socket.IO initialized");

/* Init DB + MQTT */
(async () => {
  try {
    await redisClient.connect();
    console.log("🟢 Redis service ready");

    await connectMongo();
    console.log("🟢 MongoDB service ready");

    initMQTT();
    console.log("🟢 MQTT service started");

  } catch (err) {
    console.error("🔴 Startup failure:", err);
  }
})();

/* Health route */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* Start server */
server.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});
