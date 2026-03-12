import Report from "../models/reportmodel.js";
import { spawnPython } from "../utils/spawnPython.js";
import {
  buildPriceInput,
  buildShelfLifeInput,
  buildAdvisoryInput,
} from "./validationService.js";

/* =====================================================
   MAIN AI ORCHESTRATOR
===================================================== */

export const createAIInferenceRunner = ({
  ReportModel = Report,
  runPython = spawnPython,
  priceInputBuilder = buildPriceInput,
  shelfInputBuilder = buildShelfLifeInput,
  advisoryInputBuilder = buildAdvisoryInput,
} = {}) => {
  return async (validatedData) => {
    try {
      console.log("🤖 AI inference started");

      /* ---------- Build model-specific inputs ---------- */
      const priceInput = priceInputBuilder(validatedData);
      const shelfInput = shelfInputBuilder(validatedData);
      const advisoryInput = advisoryInputBuilder(validatedData);

      /* ---------- Run Python agents in parallel ---------- */
      const [priceResult, shelfResult, advisoryResult] = await Promise.allSettled([
        runPython("agents/price_agent.py", priceInput),
        runPython("agents/shelf_life_agent.py", shelfInput),
        runPython("agents/adivasory/main.py", advisoryInput),
      ]);

      /* ---------- Fallback-safe extraction ---------- */
      const price =
        priceResult.status === "fulfilled"
          ? priceResult.value
          : { value: null, error: "price model failed" };

      const shelfLife =
        shelfResult.status === "fulfilled"
          ? shelfResult.value
          : { value: null, error: "shelf-life model failed" };

      const advisory =
        advisoryResult.status === "fulfilled"
          ? advisoryResult.value
          : { text: "Advisory unavailable due to model error" };


      /* ---------- Build final report object ---------- */
      const reportId = `GQ-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const finalReport = {
        reportId,
        grade: validatedData.grade,
        purity: validatedData.purity,
        impurities: validatedData.impurities,

        aiOutputs: {
          price,
          shelfLife,
          advisory,
        },

        sensorSnapshot: {
          temperature: validatedData.temperature,
          humidity: validatedData.humidity,
          moisture: validatedData.moisture,
        },
      };

      /* ---------- Save to MongoDB ---------- */
      const savedReport = await ReportModel.create(finalReport);

      console.log("🟢 AI report saved to MongoDB");

      return savedReport;
    } catch (error) {
      console.error("🔴 AI inference error:", error.message);
      throw error;
    }
  };
};

export const runAIInference = createAIInferenceRunner();
