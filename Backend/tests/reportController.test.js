import test from "node:test";
import assert from "node:assert/strict";

import { createReportController } from "../src/controllers/reportController.js";
import { createMockResponse, validPayload } from "./helpers.js";

test("createReport returns 201 when validation and AI inference succeed", async () => {
  const controller = createReportController({
    validatePayload: () => ({ valid: true, data: validPayload }),
    inferAI: async () => ({ _id: "r1", purity: validPayload.purity }),
    ReportModel: {},
  });

  const req = { body: validPayload };
  const res = createMockResponse();

  await controller.createReport(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data._id, "r1");
});

test("createReport returns 400 when validation fails", async () => {
  const controller = createReportController({
    validatePayload: () => ({ valid: false, errors: ["grade is required"] }),
    inferAI: async () => {
      throw new Error("should not run");
    },
    ReportModel: {},
  });

  const req = { body: { bad: "payload" } };
  const res = createMockResponse();

  await controller.createReport(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.ok(res.body.errors.includes("grade is required"));
});

test("createReport returns fallback response on inference failure", async () => {
  const controller = createReportController({
    validatePayload: () => ({ valid: true, data: validPayload }),
    inferAI: async () => {
      throw new Error("agent cluster unavailable");
    },
    fallbackReportBuilder: () => ({ grade: "B", aiOutputs: {} }),
    ReportModel: {},
  });

  const req = { body: validPayload };
  const res = createMockResponse();

  await controller.createReport(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.data.grade, "B");
});

test("getReportById returns 404 when report is missing", async () => {
  const controller = createReportController({
    ReportModel: {
      findById() {
        return {
          lean: async () => null,
        };
      },
    },
    inferAI: async () => ({}),
    validatePayload: () => ({ valid: true, data: validPayload }),
  });

  const req = { params: { id: "missing-id" } };
  const res = createMockResponse();

  await controller.getReportById(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});

test("getReportById returns 400 for invalid object id format", async () => {
  const controller = createReportController({
    ReportModel: {
      findById() {
        return {
          lean: async () => {
            const error = new Error("Cast to ObjectId failed");
            error.name = "CastError";
            throw error;
          },
        };
      },
    },
    inferAI: async () => ({}),
    validatePayload: () => ({ valid: true, data: validPayload }),
  });

  const req = { params: { id: "invalid-object-id" } };
  const res = createMockResponse();

  await controller.getReportById(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("getLatestReport returns newest report when available", async () => {
  const controller = createReportController({
    ReportModel: {
      findOne() {
        return {
          sort() {
            return {
              lean: async () => ({ _id: "latest-1", purity: 95 }),
            };
          },
        };
      },
    },
    inferAI: async () => ({}),
    validatePayload: () => ({ valid: true, data: validPayload }),
  });

  const req = {};
  const res = createMockResponse();

  await controller.getLatestReport(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data._id, "latest-1");
});

test("captureGrain returns 200 on success", async () => {
  const controller = createReportController({
    publishTrigger: () => true,
    ReportModel: {},
    inferAI: async () => ({}),
    validatePayload: () => ({ valid: true, data: validPayload }),
  });

  const req = {};
  const res = createMockResponse();

  await controller.captureGrain(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message, "Capture command sent");
});

test("captureGrain returns 503 when MQTT fails", async () => {
  const controller = createReportController({
    publishTrigger: () => false,
    ReportModel: {},
    inferAI: async () => ({}),
    validatePayload: () => ({ valid: true, data: validPayload }),
  });

  const req = {};
  const res = createMockResponse();

  await controller.captureGrain(req, res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, "MQTT service unavailable");
});
