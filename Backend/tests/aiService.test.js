import test from "node:test";
import assert from "node:assert/strict";

import { createAIInferenceRunner } from "../src/services/aiService.js";
import { validPayload } from "./helpers.js";

test("AI pipeline saves report when all agents succeed", async () => {
  const createdReports = [];
  const runPythonCalls = [];

  const runInference = createAIInferenceRunner({
    runPython: async (scriptPath, input) => {
      runPythonCalls.push({ scriptPath, input });

      if (scriptPath.includes("price_agent")) {
        return { value: 2550, currency: "INR" };
      }
      if (scriptPath.includes("shelf_life_agent")) {
        return { value: 42, unit: "days" };
      }
      return { text: "Store below 25C and humidity under 65%." };
    },
    ReportModel: {
      async create(report) {
        createdReports.push(report);
        return { _id: "report-1", ...report };
      },
    },
  });

  const saved = await runInference(validPayload);

  assert.equal(runPythonCalls.length, 3);
  assert.equal(createdReports.length, 1);
  assert.equal(saved._id, "report-1");
  assert.equal(saved.aiOutputs.price.value, 2550);
  assert.equal(saved.aiOutputs.shelfLife.value, 42);
  assert.ok(saved.aiOutputs.advisory.text.includes("humidity"));
});

test("AI pipeline uses fallback output when one agent fails", async () => {
  const runInference = createAIInferenceRunner({
    runPython: async (scriptPath) => {
      if (scriptPath.includes("price_agent")) {
        throw new Error("price model timeout");
      }
      if (scriptPath.includes("shelf_life_agent")) {
        return { value: 30, unit: "days" };
      }
      return { text: "Ventilate storage area." };
    },
    ReportModel: {
      async create(report) {
        return report;
      },
    },
  });

  const saved = await runInference(validPayload);

  assert.deepEqual(saved.aiOutputs.price, { value: null, error: "price model failed" });
  assert.equal(saved.aiOutputs.shelfLife.value, 30);
  assert.equal(saved.aiOutputs.advisory.text, "Ventilate storage area.");
});

test("AI pipeline throws when report persistence fails", async () => {
  const runInference = createAIInferenceRunner({
    runPython: async () => ({ value: 1 }),
    ReportModel: {
      async create() {
        throw new Error("mongo unavailable");
      },
    },
  });

  await assert.rejects(() => runInference(validPayload), /mongo unavailable/);
});
