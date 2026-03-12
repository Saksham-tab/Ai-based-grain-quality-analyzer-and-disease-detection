import mongoose from "mongoose";

/* 
   IMPURITY SUB-SCHEMA (all values in %)
 */

const impuritySchema = new mongoose.Schema(
  {
    husk: { type: Number, required: true, min: 0, max: 100 },
    stones: { type: Number, required: true, min: 0, max: 100 },
    blackSpots: { type: Number, required: true, min: 0, max: 100 },
    brokenPieces: { type: Number, required: true, min: 0, max: 100 },
    insectDamage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);


/* 
   AI OUTPUT SUB-SCHEMA
 */

const aiOutputSchema = new mongoose.Schema(
  {
    price: {
      value: { type: Number, default: null },
      market: { type: String, default: null },
      date: { type: String, default: null },
      decision: { type: String, default: null },
      error: { type: String, default: null },
    },

    shelfLife: {
      value: { type: Number, default: null },
      unit: { type: String, default: "days" },
      error: { type: String, default: null },
    },

    advisory: {
      text: { type: String, default: "" },
    },
  },
  { _id: false }
);


/* 
   SENSOR SNAPSHOT (stored once, not continuous stream)
 */

const sensorSnapshotSchema = new mongoose.Schema(
  {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    moisture: { type: Number, required: true },
  },
  { _id: false }
);


/* 
   MAIN REPORT SCHEMA
 */

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    /* Grain quality */
    grade: {
      type: String,
      enum: ["A", "B", "C"],
      required: true,
    },

    purity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    impurities: {
      type: impuritySchema,
      required: true,
    },

    /* AI results */
    aiOutputs: {
      type: aiOutputSchema,
      required: true,
    },

    /* Sensor snapshot */
    sensorSnapshot: {
      type: sensorSnapshotSchema,
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);


/* 
   EXPORT MODEL
 */

const Report = mongoose.model("Report", reportSchema);

export default Report;
