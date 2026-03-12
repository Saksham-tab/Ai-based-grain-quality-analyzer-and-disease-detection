import mongoose from "mongoose";
import env from "./env.js";

/**
 * Connect to MongoDB (Atlas or Local)
 */
export const connectMongo = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: "grain_analyzer",
    });

    console.log("🟢 MongoDB connected");

  } catch (error) {
    console.error("🔴 MongoDB connection error:", error.message);

    // Exit process if DB connection fails
    process.exit(1);
  }
};
